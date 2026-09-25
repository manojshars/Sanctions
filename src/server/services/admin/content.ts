import { z } from "zod";
import type { ContentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { assertCan, type Role } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { fetchOEmbed, parseYouTubeId } from "@/lib/youtube";
import { NotFoundError } from "../courses";

type Actor = { id: string; role: Role };

export class AdminInputError extends Error {}

const lines = (v: string | undefined | null) => (v ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
const opt = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
export const statusSchema = z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]);

async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>) {
  const root = slugify(base) || "item";
  let s = root;
  for (let i = 2; await exists(s); i++) s = `${root}-${i}`;
  return s;
}

// ───────── Courses, modules, lessons ─────────

export const courseSchema = z.object({
  title: z.string().trim().min(3).max(160),
  subtitle: z.string().trim().min(3).max(240),
  overview: z.string().trim().min(10).max(5000),
  topicId: z.string().min(1),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  format: z.enum(["SELF_PACED", "VIDEO", "READING", "BLENDED"]),
  accessTier: z.enum(["FREE", "PREMIUM"]),
  durationMinutes: z.coerce.number().int().min(5).max(10000),
  hasCertificate: z.boolean(),
  passingScore: z.coerce.number().int().min(1).max(100),
  maxAttempts: z.coerce.number().int().min(1).max(20),
  cpdHours: z.preprocess(opt, z.coerce.number().min(0).max(100).nullable()),
  objectives: z.array(z.string().trim().min(3).max(300)).max(20),
  keywords: z.array(z.string().trim().max(60)).max(20),
});

export async function saveCourse(actor: Actor, id: string | null, raw: unknown) {
  assertCan(actor.role, "content:manage");
  const { objectives, ...d } = courseSchema.parse(raw);
  const course = id
    ? await db.course.update({ where: { id }, data: d })
    : await db.course.create({ data: { ...d, slug: await uniqueSlug(d.title, async (s) => !!(await db.course.findUnique({ where: { slug: s } }))), status: "DRAFT" } });
  await db.learningObjective.deleteMany({ where: { courseId: course.id } });
  await db.learningObjective.createMany({ data: objectives.map((text, order) => ({ courseId: course.id, text, order })) });
  // Keep the final assessment in sync with course settings.
  if (course.hasCertificate) {
    await db.assessment.upsert({
      where: { slug: `final-${course.slug}` },
      update: { passingScore: course.passingScore, accessTier: course.accessTier, name: `${course.title} — Final Assessment` },
      create: { slug: `final-${course.slug}`, name: `${course.title} — Final Assessment`, description: `Final assessment for ${course.title}.`, type: "FINAL", questionCount: 10, timeLimitMinutes: 20, passingScore: course.passingScore, accessTier: course.accessTier, courseId: course.id },
    });
  }
  await audit(actor.id, id ? "course.update" : "course.create", "Course", course.id);
  return course;
}

export async function setCourseStatus(actor: Actor, id: string, status: ContentStatus) {
  assertCan(actor.role, "content:publish");
  if (status === "PUBLISHED") {
    const lessons = await db.lesson.count({ where: { module: { courseId: id } } });
    if (!lessons) throw new AdminInputError("Add at least one lesson before publishing.");
  }
  const c = await db.course.update({ where: { id }, data: { status, ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}) } });
  await audit(actor.id, `course.${status.toLowerCase()}`, "Course", id);
  return c;
}

export const moduleSchema = z.object({ title: z.string().trim().min(2).max(160), summary: z.string().trim().max(500).optional().nullable(), order: z.coerce.number().int().min(0).max(999) });

export async function saveModule(actor: Actor, courseId: string, id: string | null, raw: unknown) {
  assertCan(actor.role, "content:manage");
  const d = moduleSchema.parse(raw);
  const m = id ? await db.module.update({ where: { id }, data: d }) : await db.module.create({ data: { ...d, courseId } });
  await audit(actor.id, id ? "module.update" : "module.create", "Module", m.id);
  return m;
}

export async function deleteModule(actor: Actor, id: string) {
  assertCan(actor.role, "content:manage");
  await db.module.delete({ where: { id } });
  await audit(actor.id, "module.delete", "Module", id);
}

export const lessonSchema = z.object({
  title: z.string().trim().min(2).max(160),
  type: z.enum(["READING", "VIDEO", "EXERCISE"]),
  content: z.string().trim().min(10).max(50000),
  exercise: z.string().trim().max(3000).optional().nullable(),
  videoId: z.string().optional().nullable(),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  order: z.coerce.number().int().min(0).max(999),
});

export async function saveLesson(actor: Actor, moduleId: string, id: string | null, raw: unknown) {
  assertCan(actor.role, "content:manage");
  const d = lessonSchema.parse(raw);
  const data = { ...d, exercise: d.exercise || null, videoId: d.videoId || null };
  const l = id
    ? await db.lesson.update({ where: { id }, data })
    : await db.lesson.create({ data: { ...data, moduleId, slug: await uniqueSlug(d.title, async (s) => !!(await db.lesson.findUnique({ where: { moduleId_slug: { moduleId, slug: s } } }))) } });
  await audit(actor.id, id ? "lesson.update" : "lesson.create", "Lesson", l.id);
  return l;
}

export async function deleteLesson(actor: Actor, id: string) {
  assertCan(actor.role, "content:manage");
  await db.lesson.delete({ where: { id } });
  await audit(actor.id, "lesson.delete", "Lesson", id);
}

// ───────── Flashcards ─────────

export const deckAdminSchema = z.object({
  title: z.string().trim().min(2).max(120), description: z.string().trim().min(3).max(500),
  topicId: z.string().optional().nullable(), accessTier: z.enum(["FREE", "PREMIUM"]), status: statusSchema,
});

export async function saveDeck(actor: Actor, id: string | null, raw: unknown) {
  assertCan(actor.role, "content:manage");
  const d = deckAdminSchema.parse(raw);
  const data = { ...d, topicId: d.topicId || null };
  const deck = id ? await db.flashcardDeck.update({ where: { id }, data }) : await db.flashcardDeck.create({ data: { ...data, slug: await uniqueSlug(d.title, async (s) => !!(await db.flashcardDeck.findUnique({ where: { slug: s } }))) } });
  await audit(actor.id, id ? "deck.update" : "deck.create", "FlashcardDeck", deck.id);
  return deck;
}

export const cardAdminSchema = z.object({
  front: z.string().trim().min(2).max(500), back: z.string().trim().min(1).max(2000), explanation: z.string().trim().max(2000).optional().nullable(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]), status: statusSchema,
});

export async function saveCard(actor: Actor, deckId: string, id: string | null, raw: unknown) {
  assertCan(actor.role, "content:manage");
  const d = cardAdminSchema.parse(raw);
  const deck = await db.flashcardDeck.findUnique({ where: { id: deckId } });
  if (!deck || deck.ownerId) throw new NotFoundError("Deck not found");
  const data = { ...d, explanation: d.explanation || null, topicId: deck.topicId };
  const card = id ? await db.flashcard.update({ where: { id }, data }) : await db.flashcard.create({ data: { ...data, deckId, order: await db.flashcard.count({ where: { deckId } }) } });
  await audit(actor.id, id ? "card.update" : "card.create", "Flashcard", card.id);
  return card;
}

export async function deleteCard(actor: Actor, id: string) {
  assertCan(actor.role, "content:manage");
  await db.flashcard.delete({ where: { id } });
  await audit(actor.id, "card.delete", "Flashcard", id);
}

// ───────── Videos ─────────

export const videoAdminSchema = z.object({
  url: z.string().trim().min(5),
  title: z.string().trim().max(200).optional().nullable(),
  channelName: z.string().trim().max(160).optional().nullable(),
  channelUrl: z.preprocess(opt, z.string().url().nullable()),
  description: z.string().trim().min(10).max(3000),
  durationMinutes: z.preprocess(opt, z.coerce.number().int().min(1).max(600).nullable()),
  topicId: z.string().min(1),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  accessTier: z.enum(["FREE", "PREMIUM"]),
  objectives: z.array(z.string().trim().max(300)).max(10),
  courseId: z.string().optional().nullable(),
  status: statusSchema,
  manuallyVerified: z.boolean().default(false),
});

/**
 * Adds or updates a video. The YouTube ID is parsed from the URL and verified via oEmbed.
 * If YouTube cannot be reached (e.g. restricted network), an editor may publish only after
 * explicitly attesting that they verified the video and channel manually; the record keeps the
 * verification timestamp. Title/channel fall back to oEmbed data when left blank.
 */
export async function saveVideo(actor: Actor, id: string | null, raw: unknown, fetchImpl?: typeof fetch) {
  assertCan(actor.role, "content:manage");
  const d = videoAdminSchema.parse(raw);
  const youtubeId = parseYouTubeId(d.url);
  if (!youtubeId) throw new AdminInputError("Enter a valid YouTube URL or 11-character video ID.");
  const dup = await db.videoResource.findUnique({ where: { youtubeId } });
  if (dup && dup.id !== id) throw new AdminInputError("This video is already in the library.");
  const check = await fetchOEmbed(youtubeId, fetchImpl);
  if (check.reachable && !check.exists) throw new AdminInputError(`YouTube reports: ${check.error}.`);
  const verified = (check.reachable && check.exists) || d.manuallyVerified;
  if (d.status === "PUBLISHED" && !verified) throw new AdminInputError("YouTube could not be reached to verify this video. Confirm manual verification before publishing, or save as draft.");
  const title = d.title || check.title;
  const channelName = d.channelName || check.authorName;
  if (!title || !channelName) throw new AdminInputError("Title and source channel are required (automatic lookup unavailable).");
  const data = {
    youtubeId, title, channelName, channelUrl: d.channelUrl ?? check.authorUrl ?? null, description: d.description,
    durationSeconds: d.durationMinutes ? d.durationMinutes * 60 : null, topicId: d.topicId, difficulty: d.difficulty, accessTier: d.accessTier,
    objectives: d.objectives, courseId: d.courseId || null, status: d.status, verifiedAt: verified ? new Date() : null, unavailable: false,
  };
  const v = id ? await db.videoResource.update({ where: { id }, data }) : await db.videoResource.create({ data });
  await audit(actor.id, id ? "video.update" : "video.create", "VideoResource", v.id, { youtubeId, verifiedBy: check.exists ? "oembed" : d.manuallyVerified ? "manual" : "none" });
  return { video: v, check };
}

export async function setVideoUnavailable(actor: Actor, id: string, unavailable: boolean) {
  assertCan(actor.role, "content:manage");
  await db.videoResource.update({ where: { id }, data: { unavailable } });
  await audit(actor.id, unavailable ? "video.unavailable" : "video.available", "VideoResource", id);
}

export async function savePlaylist(actor: Actor, raw: { title: string; description: string; videoIds: string[] }) {
  assertCan(actor.role, "content:manage");
  const d = z.object({ title: z.string().trim().min(2).max(120), description: z.string().trim().max(500), videoIds: z.array(z.string()).max(100) }).parse(raw);
  const p = await db.videoPlaylist.create({ data: { title: d.title, description: d.description, slug: await uniqueSlug(d.title, async (s) => !!(await db.videoPlaylist.findUnique({ where: { slug: s } }))), items: { create: d.videoIds.map((videoId, order) => ({ videoId, order })) } } });
  await audit(actor.id, "playlist.create", "VideoPlaylist", p.id);
  return p;
}

// ───────── Case studies ─────────

const simOption = z.object({ id: z.string().min(1).max(20), text: z.string().min(1), correct: z.boolean(), feedback: z.string().default("") });
export const simulationSchema = z.object({
  documents: z.array(z.object({ id: z.string().min(1), title: z.string().min(1), content: z.string() })).max(20),
  steps: z.array(z.object({ id: z.string().min(1).max(20), kind: z.enum(["questions", "indicators", "request", "explanations", "recommendation"]), prompt: z.string().min(3), multi: z.boolean(), options: z.array(simOption).min(2).max(10) })).min(1).max(12),
  modelReasoning: z.string().min(10),
});

export const caseAdminSchema = z.object({
  title: z.string().trim().min(3).max(200), summary: z.string().trim().min(10).max(600),
  category: z.enum(["AML_INVESTIGATION", "SANCTIONS_EXPOSURE", "OWNERSHIP_CONTROL", "SCREENING_ALERT", "TRANSACTION_MONITORING", "FRAUD_INVESTIGATION", "ABC_INVESTIGATION", "TBML", "EXPORT_CONTROL", "CRYPTO"]),
  topicId: z.string().min(1), difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]), accessTier: z.enum(["FREE", "PREMIUM"]),
  isFictional: z.boolean(), featured: z.boolean(), status: statusSchema,
  background: z.string().trim().min(10), profile: z.string().trim().min(3), transactionDetails: z.string().trim().min(3), businessContext: z.string().trim().min(3),
  redFlags: z.string(), riskIndicators: z.string(), investigationQuestions: z.string(), evidenceRequired: z.string(), investigationSteps: z.string(),
  possibleFindings: z.string().trim().min(3), alternativeExplanations: z.string(), riskConsiderations: z.string().trim().min(3), conclusion: z.string().trim().min(3),
  references: z.string(), followUps: z.string(), simulationJson: z.string(),
});

export async function saveCaseStudy(actor: Actor, id: string | null, raw: unknown) {
  assertCan(actor.role, "content:manage");
  const d = caseAdminSchema.parse(raw);
  let simulation: z.infer<typeof simulationSchema>;
  try {
    simulation = simulationSchema.parse(JSON.parse(d.simulationJson));
  } catch (e) {
    throw new AdminInputError(`Simulation JSON is invalid: ${e instanceof z.ZodError ? e.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ") : (e as Error).message}`);
  }
  const references = lines(d.references).map((l) => { const [title, url] = l.split("|").map((s) => s.trim()); return { title, url: url ?? "" }; }).filter((r) => r.title && /^https?:\/\//.test(r.url));
  const followUpQuestions = lines(d.followUps).map((l) => { const [q, a] = l.split("|").map((s) => s.trim()); return { q, a: a ?? "" }; }).filter((f) => f.q);
  const data = {
    title: d.title, summary: d.summary, category: d.category, topicId: d.topicId, difficulty: d.difficulty, accessTier: d.accessTier, isFictional: d.isFictional, featured: d.featured, status: d.status,
    background: d.background, profile: d.profile, transactionDetails: d.transactionDetails, businessContext: d.businessContext,
    redFlags: lines(d.redFlags), riskIndicators: lines(d.riskIndicators), investigationQuestions: lines(d.investigationQuestions), evidenceRequired: lines(d.evidenceRequired),
    investigationSteps: lines(d.investigationSteps), possibleFindings: d.possibleFindings, alternativeExplanations: lines(d.alternativeExplanations),
    riskConsiderations: d.riskConsiderations, conclusion: d.conclusion, references, followUpQuestions, simulation: simulation as unknown as Prisma.InputJsonValue,
  };
  const c = id ? await db.caseStudy.update({ where: { id }, data }) : await db.caseStudy.create({ data: { ...data, slug: await uniqueSlug(d.title, async (s) => !!(await db.caseStudy.findUnique({ where: { slug: s } }))) } });
  await audit(actor.id, id ? "case.update" : "case.create", "CaseStudy", c.id);
  return c;
}

// ───────── Knowledge: glossary, regulations, typologies, articles, help ─────────

export const glossarySchema = z.object({ term: z.string().trim().min(2).max(120), definition: z.string().trim().min(10).max(2000), topicId: z.string().min(1), relatedTerms: z.string(), example: z.string().trim().max(1000).optional().nullable(), sourceReference: z.string().trim().max(300).optional().nullable(), sourceUrl: z.preprocess(opt, z.string().url().nullable()), status: statusSchema });
export const regulationSchema = z.object({ authority: z.string().trim().min(2).max(120), title: z.string().trim().min(3).max(300), jurisdiction: z.string().trim().min(2).max(120), summary: z.string().trim().min(10).max(3000), officialUrl: z.string().url(), publishedDate: z.preprocess(opt, z.coerce.date().nullable()), effectiveDate: z.preprocess(opt, z.coerce.date().nullable()), dateNote: z.string().trim().max(300).optional().nullable(), regStatus: z.enum(["CURRENT", "HISTORICAL"]), topicId: z.string().optional().nullable(), status: statusSchema });
export const typologySchema = z.object({ title: z.string().trim().min(3).max(160), category: z.enum(["MONEY_LAUNDERING", "SANCTIONS_EVASION", "FRAUD", "ABC", "TRADE_BASED", "CUSTOMER_RISK", "TRANSACTION"]), description: z.string().trim().min(10).max(2000), indicators: z.string(), example: z.string().trim().max(2000).optional().nullable(), sourceReference: z.string().trim().max(300).optional().nullable(), sourceUrl: z.preprocess(opt, z.string().url().nullable()), status: statusSchema });
export const articleSchema = z.object({ title: z.string().trim().min(3).max(200), excerpt: z.string().trim().min(10).max(500), content: z.string().trim().min(20).max(100000), category: z.enum(["EDUCATIONAL", "REGULATORY_EXPLAINER", "TRENDS", "INVESTIGATION_GUIDE", "CASE_ANALYSIS", "CONTROL_GUIDANCE"]), topicId: z.string().optional().nullable(), sources: z.string(), readingMinutes: z.coerce.number().int().min(1).max(120), status: statusSchema });
export const helpSchema = z.object({ title: z.string().trim().min(3).max(200), category: z.string().trim().min(2).max(80), content: z.string().trim().min(10).max(50000), relatedSlugs: z.string(), status: statusSchema });

export type KnowledgeKind = "glossary" | "regulation" | "typology" | "article" | "help";

export async function saveKnowledge(actor: Actor, kind: KnowledgeKind, id: string | null, raw: unknown) {
  assertCan(actor.role, "content:manage");
  const now = new Date();
  let saved: { id: string };
  if (kind === "glossary") {
    const d = glossarySchema.parse(raw);
    const data = { ...d, relatedTerms: d.relatedTerms.split(",").map((s) => s.trim()).filter(Boolean), lastReviewedAt: now };
    saved = id ? await db.glossaryTerm.update({ where: { id }, data }) : await db.glossaryTerm.create({ data: { ...data, slug: await uniqueSlug(d.term, async (s) => !!(await db.glossaryTerm.findUnique({ where: { slug: s } }))) } });
  } else if (kind === "regulation") {
    const d = regulationSchema.parse(raw);
    const data = { ...d, topicId: d.topicId || null, lastReviewedAt: now };
    saved = id ? await db.regulatoryReference.update({ where: { id }, data }) : await db.regulatoryReference.create({ data: { ...data, slug: await uniqueSlug(d.title, async (s) => !!(await db.regulatoryReference.findUnique({ where: { slug: s } }))) } });
  } else if (kind === "typology") {
    const d = typologySchema.parse(raw);
    const data = { ...d, indicators: lines(d.indicators), lastReviewedAt: now };
    saved = id ? await db.typology.update({ where: { id }, data }) : await db.typology.create({ data: { ...data, slug: await uniqueSlug(d.title, async (s) => !!(await db.typology.findUnique({ where: { slug: s } }))) } });
  } else if (kind === "article") {
    const d = articleSchema.parse(raw);
    const sources = lines(d.sources).map((l) => { const [title, url] = l.split("|").map((s) => s.trim()); return { title, url: url ?? "" }; }).filter((s) => s.title && /^https?:\/\//.test(s.url));
    if (d.category === "REGULATORY_EXPLAINER" && !sources.length) throw new AdminInputError("Regulatory explainers must include at least one source reference.");
    const existing = id ? await db.article.findUnique({ where: { id } }) : null;
    const data = { ...d, topicId: d.topicId || null, sources, lastReviewedAt: now, ...(d.status === "PUBLISHED" && !existing?.publishedAt ? { publishedAt: now } : {}) };
    saved = id ? await db.article.update({ where: { id }, data }) : await db.article.create({ data: { ...data, slug: await uniqueSlug(d.title, async (s) => !!(await db.article.findUnique({ where: { slug: s } }))) } });
  } else {
    const d = helpSchema.parse(raw);
    const data = { ...d, relatedSlugs: d.relatedSlugs.split(",").map((s) => s.trim()).filter(Boolean) };
    saved = id ? await db.helpArticle.update({ where: { id }, data }) : await db.helpArticle.create({ data: { ...data, slug: await uniqueSlug(d.title, async (s) => !!(await db.helpArticle.findUnique({ where: { slug: s } }))) } });
  }
  await audit(actor.id, `${kind}.${id ? "update" : "create"}`, kind, saved.id);
  return saved;
}
