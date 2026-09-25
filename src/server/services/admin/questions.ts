import { z } from "zod";
import type { ContentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { assertCan, type Role } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { questionContentHash } from "@/lib/question-hash";
import { parseCsvObjects } from "@/lib/csv";
import { NotFoundError } from "../courses";

type Actor = { id: string; role: Role };

export const optionSchema = z.object({
  text: z.string().trim().min(1, "Option text is required.").max(1000),
  isCorrect: z.boolean().default(false),
  matchText: z.string().trim().max(300).optional().nullable(),
  explanation: z.string().trim().max(1000).optional().nullable(),
});

export const questionInputSchema = z.object({
  topicId: z.string().min(1, "Choose a topic."),
  type: z.enum(["SINGLE", "MULTIPLE", "TRUE_FALSE", "SCENARIO", "MATCHING", "FILL_BLANK", "SHORT_ANSWER", "INVESTIGATION"]),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  stem: z.string().trim().min(10, "Question text must be at least 10 characters.").max(2000),
  scenario: z.string().trim().max(5000).optional().nullable(),
  explanation: z.string().trim().min(10, "An explanation is required.").max(5000),
  practicalApplication: z.string().trim().max(3000).optional().nullable(),
  sourceReference: z.string().trim().max(300).optional().nullable(),
  sourceUrl: z.string().trim().url("Source URL must be a valid URL.").max(500).optional().nullable().or(z.literal("").transform(() => null)),
  tags: z.array(z.string().trim().max(40)).max(15).default([]),
  accessTier: z.enum(["FREE", "PREMIUM"]).default("PREMIUM"),
  courseId: z.string().optional().nullable(),
  options: z.array(optionSchema).max(10).default([]),
  acceptedAnswers: z.array(z.string().trim().max(200)).max(20).default([]),
  keywords: z.array(z.string().trim().max(200)).max(20).default([]),
  modelAnswer: z.string().trim().max(3000).optional().nullable(),
});
export type QuestionInput = z.infer<typeof questionInputSchema>;

/** Structural rules per question type. Returns a list of problems (empty = valid). */
export function questionShapeIssues(q: QuestionInput): string[] {
  const issues: string[] = [];
  const correct = q.options.filter((o) => o.isCorrect).length;
  switch (q.type) {
    case "SINGLE":
    case "SCENARIO":
      if (q.options.length < 2) issues.push("Add at least two answer options.");
      if (correct !== 1) issues.push("Mark exactly one option as correct.");
      if (q.type === "SCENARIO" && !q.scenario) issues.push("Scenario questions need scenario text.");
      break;
    case "TRUE_FALSE":
      if (q.options.length !== 2) issues.push("True/false questions need exactly two options.");
      if (correct !== 1) issues.push("Mark exactly one option as correct.");
      break;
    case "MULTIPLE":
    case "INVESTIGATION":
      if (q.options.length < 3) issues.push("Add at least three options.");
      if (correct < 1) issues.push("Mark at least one option as correct.");
      break;
    case "MATCHING":
      if (q.options.length < 2) issues.push("Add at least two matching pairs.");
      if (q.options.some((o) => !o.matchText)) issues.push("Every matching item needs a matching value.");
      break;
    case "FILL_BLANK":
      if (!q.acceptedAnswers.filter(Boolean).length) issues.push("Add at least one accepted answer.");
      break;
    case "SHORT_ANSWER":
      if (!q.acceptedAnswers.filter(Boolean).length && !q.keywords.filter(Boolean).length) issues.push("Add accepted answers or keyword groups for marking.");
      if (!q.modelAnswer) issues.push("Add a model answer.");
      break;
  }
  return issues;
}

export class QuestionValidationError extends Error {
  constructor(public issues: string[]) {
    super(issues.join(" "));
  }
}

function normaliseOptions(q: QuestionInput) {
  if (q.type === "MATCHING") return q.options.map((o, i) => ({ text: o.text, isCorrect: true, matchText: o.matchText ?? null, explanation: o.explanation ?? null, order: i }));
  if (q.type === "FILL_BLANK" || q.type === "SHORT_ANSWER") return [];
  return q.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, matchText: null, explanation: o.explanation || null, order: i }));
}

export async function findDuplicate(stem: string, options: string[], excludeId?: string) {
  const hash = questionContentHash(stem, options);
  return db.question.findFirst({ where: { contentHash: hash, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true, stem: true, status: true } });
}

export async function createQuestion(actor: Actor, raw: unknown, opts: { allowDuplicate?: boolean } = {}) {
  assertCan(actor.role, "content:manage");
  const q = questionInputSchema.parse(raw);
  const issues = questionShapeIssues(q);
  if (issues.length) throw new QuestionValidationError(issues);
  const options = normaliseOptions(q);
  const dup = await findDuplicate(q.stem, options.map((o) => o.text));
  if (dup && !opts.allowDuplicate) throw new QuestionValidationError([`Possible duplicate of an existing question (${dup.id}).`]);
  const { options: _o, ...fields } = q;
  const created = await db.question.create({
    data: { ...fields, courseId: q.courseId || null, status: "DRAFT", contentHash: questionContentHash(q.stem, options.map((o) => o.text)), authorId: actor.id, options: { create: options } },
  });
  await db.questionVersion.create({ data: { questionId: created.id, version: 1, snapshot: { ...fields, options } as unknown as Prisma.InputJsonValue, editedById: actor.id, note: "Created" } });
  await audit(actor.id, "question.create", "Question", created.id);
  return created;
}

export async function updateQuestion(actor: Actor, id: string, raw: unknown, note?: string) {
  assertCan(actor.role, "content:manage");
  const existing = await db.question.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Question not found");
  const q = questionInputSchema.parse(raw);
  const issues = questionShapeIssues(q);
  if (issues.length) throw new QuestionValidationError(issues);
  const options = normaliseOptions(q);
  const dup = await findDuplicate(q.stem, options.map((o) => o.text), id);
  if (dup) throw new QuestionValidationError([`Another question has identical content (${dup.id}).`]);
  const { options: _o, ...fields } = q;
  const version = existing.version + 1;
  const updated = await db.$transaction(async (tx) => {
    await tx.answerOption.deleteMany({ where: { questionId: id } });
    const u = await tx.question.update({
      where: { id },
      data: { ...fields, courseId: q.courseId || null, version, contentHash: questionContentHash(q.stem, options.map((o) => o.text)), options: { create: options } },
    });
    await tx.questionVersion.create({ data: { questionId: id, version, snapshot: { ...fields, options } as unknown as Prisma.InputJsonValue, editedById: actor.id, note: note ?? "Edited" } });
    return u;
  });
  await audit(actor.id, "question.update", "Question", id, { version });
  return updated;
}

const TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ["IN_REVIEW", "ARCHIVED", "PUBLISHED"],
  IN_REVIEW: ["PUBLISHED", "DRAFT", "ARCHIVED"],
  PUBLISHED: ["DRAFT", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

/** Review workflow: Draft → In review → Published; Unpublish returns to Draft; Archive retires. */
export async function transitionQuestion(actor: Actor, id: string, to: ContentStatus) {
  assertCan(actor.role, to === "PUBLISHED" ? "content:publish" : "content:manage");
  const q = await db.question.findUnique({ where: { id }, include: { options: true } });
  if (!q) throw new NotFoundError("Question not found");
  if (!TRANSITIONS[q.status].includes(to)) throw new QuestionValidationError([`Cannot move a ${q.status.toLowerCase()} question to ${to.toLowerCase()}.`]);
  if (to === "PUBLISHED") {
    const issues = questionShapeIssues({ ...q, options: q.options, tags: q.tags } as unknown as QuestionInput);
    if (issues.length) throw new QuestionValidationError(issues);
  }
  const u = await db.question.update({ where: { id }, data: { status: to, ...(to === "PUBLISHED" ? { reviewedById: actor.id, reviewedAt: new Date() } : {}) } });
  await audit(actor.id, `question.${to.toLowerCase()}`, "Question", id);
  return u;
}

export interface ImportResult { created: number; duplicates: number; errors: { row: number; message: string }[] }

const split = (v?: string) => (v ?? "").split("|").map((s) => s.trim()).filter(Boolean);

/**
 * CSV import. Columns (header row required):
 * topic, type, difficulty, stem, scenario, options, correct, explanation, practical_application,
 * source_reference, source_url, tags, access_tier, accepted_answers, keywords, model_answer, matches, course
 *  - options / tags / accepted_answers / keywords: pipe-separated
 *  - correct: pipe-separated 1-based indices or letters (e.g. "2" or "A|C")
 *  - matches: pipe-separated "left=>right" pairs (MATCHING)
 * Imported questions are created as DRAFT (or IN_REVIEW when requested) for the review workflow.
 */
export async function importQuestionsCsv(actor: Actor, csv: string, opts: { status?: "DRAFT" | "IN_REVIEW" } = {}): Promise<ImportResult> {
  assertCan(actor.role, "content:manage");
  const rows = parseCsvObjects(csv);
  if (rows.length > 2000) throw new QuestionValidationError(["Import up to 2,000 rows at a time."]);
  const topics = await db.topic.findMany();
  const courses = await db.course.findMany({ select: { id: true, slug: true } });
  const result: ImportResult = { created: 0, duplicates: 0, errors: [] };
  for (const [i, r] of rows.entries()) {
    const rowNo = i + 2;
    try {
      const topic = topics.find((t) => t.slug === r.topic || t.name.toLowerCase() === r.topic?.toLowerCase());
      if (!topic) throw new QuestionValidationError([`Unknown topic "${r.topic}".`]);
      const type = (r.type || "SINGLE").toUpperCase();
      const correctIdx = new Set(split(r.correct).map((c) => (/^[A-Za-z]$/.test(c) ? c.toUpperCase().charCodeAt(0) - 65 : Number(c) - 1)));
      const options = type === "MATCHING"
        ? split(r.matches).map((p) => { const [l, rr] = p.split("=>").map((x) => x?.trim()); return { text: l ?? "", matchText: rr ?? "", isCorrect: true }; })
        : type === "TRUE_FALSE" && !r.options
          ? ["True", "False"].map((t, k) => ({ text: t, isCorrect: correctIdx.has(k) }))
          : split(r.options).map((t, k) => ({ text: t, isCorrect: correctIdx.has(k) }));
      const input = {
        topicId: topic.id, type, difficulty: (r.difficulty || "BEGINNER").toUpperCase(), stem: r.stem, scenario: r.scenario || null,
        explanation: r.explanation, practicalApplication: r.practical_application || null, sourceReference: r.source_reference || null,
        sourceUrl: r.source_url || null, tags: split(r.tags), accessTier: (r.access_tier || "PREMIUM").toUpperCase(),
        courseId: r.course ? courses.find((c) => c.slug === r.course)?.id ?? null : null,
        options, acceptedAnswers: split(r.accepted_answers), keywords: split(r.keywords), modelAnswer: r.model_answer || null,
      };
      const parsed = questionInputSchema.safeParse(input);
      if (!parsed.success) throw new QuestionValidationError(parsed.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`));
      const dup = await findDuplicate(parsed.data.stem, normaliseOptions(parsed.data).map((o) => o.text));
      if (dup) { result.duplicates++; continue; }
      const q = await createQuestion(actor, parsed.data);
      if (opts.status === "IN_REVIEW") await db.question.update({ where: { id: q.id }, data: { status: "IN_REVIEW" } });
      result.created++;
    } catch (e) {
      if (e instanceof QuestionValidationError) result.errors.push({ row: rowNo, message: e.issues.join(" ") });
      else throw e;
    }
  }
  await audit(actor.id, "question.import", "Question", null, { ...result, errors: result.errors.length });
  return result;
}

export const CSV_TEMPLATE = `topic,type,difficulty,stem,scenario,options,correct,explanation,practical_application,source_reference,source_url,tags,access_tier,accepted_answers,keywords,model_answer,matches,course
sanctions,SINGLE,BEGINNER,"Which office administers US economic sanctions?",,"FinCEN|OFAC|SEC|FDIC",2,"OFAC, part of the US Treasury, administers most US sanctions programmes.",,OFAC,https://ofac.treasury.gov/,OFAC|basics,FREE,,,,,
aml-ctf,FILL_BLANK,BEGINNER,"Splitting cash deposits to avoid thresholds is called ______.",,,,"Structuring is the deliberate splitting of transactions.",,,,structuring,PREMIUM,structuring|smurfing,,,,
`;
