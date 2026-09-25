import { z } from "zod";
import type { AttemptKind, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { allowedTiers, getEntitlements, hasFeature, type Entitlements } from "@/lib/entitlements";
import type { Role } from "@/lib/rbac";
import { gradeQuestion, scorePercent, topicBreakdown, type QuestionResponse, type TopicStat } from "@/lib/scoring";
import { dayKey, hashString, shuffle } from "@/lib/utils";
import { AccessError, NotFoundError } from "./courses";
import { completeCourseIfEligible, getCompletionStatus } from "./certificates";

export class AttemptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttemptError";
  }
}

type Actor = { id: string; role: Role };
const GRACE_MS = 30_000; // network grace period after the timer ends

export const PRACTICE_MODES = {
  QUICK: { label: "Quick Practice", count: 5 },
  STANDARD: { label: "Standard Practice", count: 10 },
  DEEP: { label: "Deep Practice", count: 25 },
  TOPIC_MASTERY: { label: "Topic Mastery", count: 10 },
  DAILY_CHALLENGE: { label: "Daily Challenge", count: 5 },
  INCORRECT_REVIEW: { label: "Incorrect Answer Review", count: 10 },
  BOOKMARKED: { label: "Bookmarked Questions", count: 10 },
  CUSTOM: { label: "Custom Practice", count: 10 },
} as const;
export type PracticeMode = keyof typeof PRACTICE_MODES;

export const responseSchema = z.object({
  selected: z.array(z.string().max(40)).max(20).optional(),
  text: z.string().max(2000).optional(),
  matches: z.record(z.string().max(40), z.string().max(300)).optional(),
});

/** Seeded PRNG (mulberry32) for reproducible daily selections. */
export function seededRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Candidate { id: string; topicSlug: string; accessTier: "FREE" | "PREMIUM" }

async function candidatePool(ent: Entitlements, opts: { topics?: string[]; difficulty?: string | null; ids?: string[]; courseId?: string }): Promise<Candidate[]> {
  const where: Prisma.QuestionWhereInput = { status: "PUBLISHED" };
  if (opts.topics?.length) where.topic = { slug: { in: opts.topics } };
  if (opts.difficulty && ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(opts.difficulty)) where.difficulty = opts.difficulty as never;
  if (opts.ids) where.id = { in: opts.ids };
  if (opts.courseId) where.courseId = opts.courseId;
  const rows = await db.question.findMany({ where, select: { id: true, accessTier: true, topic: { select: { slug: true } } }, orderBy: { id: "asc" } });
  return rows
    .map((r) => ({ id: r.id, accessTier: r.accessTier, topicSlug: r.topic.slug }))
    .filter((q) => allowedTiers(ent, q.topicSlug).includes(q.accessTier));
}

async function createAttempt(userId: string, data: {
  kind: AttemptKind; mode: string; questionIds: string[]; config: Record<string, unknown>;
  timeLimitSeconds?: number | null; assessmentId?: string; courseId?: string;
}) {
  if (!data.questionIds.length) throw new AttemptError("No questions are available for this selection yet. Try a different topic or difficulty.");
  const now = new Date();
  return db.attempt.create({
    data: {
      userId, kind: data.kind, mode: data.mode, config: data.config as Prisma.InputJsonValue,
      timed: !!data.timeLimitSeconds, timeLimitSeconds: data.timeLimitSeconds ?? null,
      expiresAt: data.timeLimitSeconds ? new Date(now.getTime() + data.timeLimitSeconds * 1000) : null,
      assessmentId: data.assessmentId, courseId: data.courseId, totalCount: data.questionIds.length,
      items: { create: data.questionIds.map((questionId, order) => ({ questionId, order })) },
    },
  });
}

/** Topic accuracy for a learner, from all graded attempt items. */
export async function topicAccuracy(userId: string): Promise<TopicStat[]> {
  const items = await db.attemptItem.findMany({
    where: { attempt: { userId }, isCorrect: { not: null } },
    select: { isCorrect: true, question: { select: { topic: { select: { slug: true } } } } },
  });
  return topicBreakdown(items.map((i) => ({ topic: i.question.topic.slug, correct: !!i.isCorrect })));
}

export async function startPractice(user: Actor, input: { mode: PracticeMode; topic?: string; difficulty?: string; count?: number; timed?: boolean; rng?: () => number }) {
  const mode = input.mode in PRACTICE_MODES ? input.mode : "STANDARD";
  const ent = await getEntitlements(user);
  const rng = input.rng ?? Math.random;
  let count: number = Math.min(Math.max(input.count ?? PRACTICE_MODES[mode].count, 1), 50);
  let topics = input.topic ? [input.topic] : undefined;
  let ids: string[] | undefined;
  let kind: AttemptKind = "PRACTICE";

  if (mode === "DAILY_CHALLENGE") {
    kind = "DAILY_CHALLENGE";
    const today = dayKey();
    const existing = await db.attempt.findFirst({ where: { userId: user.id, kind: "DAILY_CHALLENGE", config: { path: ["day"], equals: today } } });
    if (existing) return existing;
    const pool = await candidatePool(ent, {});
    const picked = shuffle(pool.map((p) => p.id), seededRng(hashString(`daily:${today}`))).slice(0, 5);
    return createAttempt(user.id, { kind, mode, questionIds: picked, config: { day: today, mode } });
  }

  if (mode === "TOPIC_MASTERY" && !topics) {
    const stats = await topicAccuracy(user.id);
    const weakest = stats.filter((s) => s.total >= 1).sort((a, b) => a.accuracy - b.accuracy).slice(0, 2).map((s) => s.topic);
    topics = weakest.length ? weakest : undefined;
  }

  if (mode === "INCORRECT_REVIEW") {
    const wrong = await db.attemptItem.findMany({ where: { attempt: { userId: user.id }, isCorrect: false }, select: { questionId: true, answeredAt: true } });
    const right = await db.attemptItem.findMany({ where: { attempt: { userId: user.id }, isCorrect: true }, select: { questionId: true, answeredAt: true } });
    const lastRight = new Map<string, number>();
    for (const r of right) lastRight.set(r.questionId, Math.max(lastRight.get(r.questionId) ?? 0, r.answeredAt?.getTime() ?? 0));
    const missed = new Set<string>();
    for (const w of wrong) if ((w.answeredAt?.getTime() ?? 0) >= (lastRight.get(w.questionId) ?? 0)) missed.add(w.questionId);
    ids = [...missed];
    if (!ids.length) throw new AttemptError("You have no incorrect answers to review — great work! Try a new practice session.");
  }

  if (mode === "BOOKMARKED") {
    const bm = await db.bookmark.findMany({ where: { userId: user.id, entityType: "QUESTION" }, select: { entityId: true } });
    ids = [...new Set(bm.map((b) => b.entityId))];
    if (!ids.length) throw new AttemptError("You haven't bookmarked or flagged any questions yet.");
  }

  const pool = await candidatePool(ent, { topics, difficulty: input.difficulty, ids });
  count = Math.min(count, pool.length);
  const picked = shuffle(pool.map((p) => p.id), rng).slice(0, count);
  const timeLimitSeconds = input.timed ? Math.max(60, picked.length * 75) : null;
  return createAttempt(user.id, { kind, mode, questionIds: picked, timeLimitSeconds, config: { mode, topic: input.topic ?? null, topics: topics ?? [], difficulty: input.difficulty ?? null } });
}

export const examConfigSchema = z.object({
  topics: z.array(z.string().max(60)).max(11).optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional().nullable(),
  questionCount: z.coerce.number().int().min(5).max(150).optional(),
  timeLimitMinutes: z.coerce.number().int().min(0).max(240).optional(),
});

export async function startAssessment(user: Actor, slug: string, config: z.infer<typeof examConfigSchema> = {}, rng: () => number = Math.random) {
  const a = await db.assessment.findFirst({ where: { slug, status: "PUBLISHED", type: { in: ["MOCK_EXAM", "READINESS"] } } });
  if (!a) throw new NotFoundError("Assessment not found");
  const ent = await getEntitlements(user);
  if (a.accessTier === "PREMIUM" && !hasFeature(ent, "MOCK_EXAMS")) throw new AccessError("Mock examinations require Premium or a package that includes mock exams.");
  const topics = a.configurable && config.topics?.length ? config.topics : a.topicSlugs.length ? a.topicSlugs : undefined;
  // For configurable exams, `null` means "any difficulty"; `undefined` means "use the template default".
  const difficulty = a.configurable && config.difficulty !== undefined ? config.difficulty : a.difficulty;
  const count = a.configurable && config.questionCount ? config.questionCount : a.questionCount;
  const minutes = a.configurable && config.timeLimitMinutes !== undefined ? config.timeLimitMinutes : a.timeLimitMinutes;
  const pool = await candidatePool(ent, { topics, difficulty });
  let picked: string[];
  if (a.type === "READINESS") {
    // Stratify across topics so every area is diagnosed.
    const byTopic = new Map<string, string[]>();
    for (const c of shuffle(pool, rng)) byTopic.set(c.topicSlug, [...(byTopic.get(c.topicSlug) ?? []), c.id]);
    picked = [];
    while (picked.length < count && [...byTopic.values()].some((v) => v.length)) {
      for (const list of byTopic.values()) if (list.length && picked.length < count) picked.push(list.shift()!);
    }
  } else {
    picked = shuffle(pool.map((p) => p.id), rng).slice(0, count);
  }
  return createAttempt(user.id, {
    kind: a.type === "READINESS" ? "READINESS" : "MOCK_EXAM", mode: a.slug, assessmentId: a.id, questionIds: picked,
    timeLimitSeconds: minutes ? minutes * 60 : null,
    config: { requested: count, available: pool.length, topics: topics ?? [], difficulty: difficulty ?? null, timeLimitMinutes: minutes ?? null },
  });
}

export async function startFinalAssessment(user: Actor, courseId: string, rng: () => number = Math.random) {
  const course = await db.course.findUnique({ where: { id: courseId }, include: { topic: true, assessments: { where: { type: "FINAL" } } } });
  const final = course?.assessments[0];
  if (!course || !final) throw new NotFoundError("This course has no final assessment.");
  const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
  if (!enrollment) throw new AccessError("Enrol in the course first.");
  const status = await getCompletionStatus(user.id, courseId);
  if (!status.lessonsComplete) throw new AttemptError("Complete all lessons before starting the final assessment.");
  if (status.finalPassed) throw new AttemptError("You have already passed this assessment.");
  if (status.attemptsUsed >= course.maxAttempts) throw new AttemptError(`You have used all ${course.maxAttempts} attempts. Contact support if you need an additional attempt.`);
  const open = await db.attempt.findFirst({ where: { userId: user.id, assessmentId: final.id, status: "IN_PROGRESS" } });
  if (open) return open;
  // Course-linked questions first, then same-topic questions (all tiers — course access already verified).
  const courseQs = shuffle((await db.question.findMany({ where: { courseId, status: "PUBLISHED" }, select: { id: true } })).map((q) => q.id), rng);
  const topicQs = shuffle((await db.question.findMany({ where: { topicId: course.topicId, status: "PUBLISHED", courseId: { not: courseId } }, select: { id: true } })).map((q) => q.id), rng);
  const picked = [...courseQs, ...topicQs].slice(0, final.questionCount);
  return createAttempt(user.id, {
    kind: "FINAL", mode: "FINAL", assessmentId: final.id, courseId, questionIds: picked,
    timeLimitSeconds: final.timeLimitMinutes ? final.timeLimitMinutes * 60 : null, config: { passingScore: final.passingScore },
  });
}

const EXAM_KINDS: AttemptKind[] = ["MOCK_EXAM", "READINESS", "FINAL"];
export const isExamKind = (k: AttemptKind) => EXAM_KINDS.includes(k);

async function loadOwnedAttempt(userId: string, attemptId: string) {
  const attempt = await db.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== userId) throw new NotFoundError("Session not found");
  return attempt;
}

function isExpired(a: { expiresAt: Date | null }, now = new Date()) {
  return !!a.expiresAt && now.getTime() > a.expiresAt.getTime() + GRACE_MS;
}

/** Client-safe view of an in-progress attempt: never includes correctness or explanations. */
export async function getAttemptSession(userId: string, attemptId: string) {
  let attempt = await loadOwnedAttempt(userId, attemptId);
  if (attempt.status === "IN_PROGRESS" && isExpired(attempt)) {
    await submitAttempt(userId, attemptId, { auto: true });
    attempt = await loadOwnedAttempt(userId, attemptId);
  }
  const items = await db.attemptItem.findMany({
    where: { attemptId },
    orderBy: { order: "asc" },
    include: { question: { include: { options: { orderBy: { order: "asc" } }, topic: { select: { name: true, slug: true } } } } },
  });
  const rng = seededRng(hashString(attemptId));
  const questions = items.map((it) => {
    const q = it.question;
    const revealed = !isExamKind(attempt.kind) && it.isCorrect !== null; // practice: checked answers show feedback
    return {
      itemId: it.id,
      questionId: q.id,
      order: it.order,
      type: q.type,
      stem: q.stem,
      scenario: q.scenario,
      difficulty: q.difficulty,
      topic: q.topic.name,
      options: q.type === "FILL_BLANK" || q.type === "SHORT_ANSWER" ? [] : q.options.map((o) => ({ id: o.id, text: o.text })),
      matchChoices: q.type === "MATCHING" ? shuffle(q.options.map((o) => o.matchText ?? ""), rng) : [],
      response: (it.response as QuestionResponse | null) ?? null,
      markedForReview: it.markedForReview,
      feedback: revealed ? feedbackFor(q, it.isCorrect!) : null,
    };
  });
  return { attempt, questions };
}

type QWithOptions = Prisma.QuestionGetPayload<{ include: { options: true } }>;

export function feedbackFor(q: QWithOptions, correct: boolean) {
  return {
    correct,
    explanation: q.explanation,
    practicalApplication: q.practicalApplication,
    sourceReference: q.sourceReference,
    sourceUrl: q.sourceUrl,
    modelAnswer: q.modelAnswer,
    acceptedAnswers: q.type === "FILL_BLANK" ? q.acceptedAnswers : [],
    correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
    correctMatches: q.type === "MATCHING" ? Object.fromEntries(q.options.map((o) => [o.id, o.matchText ?? ""])) : {},
    optionExplanations: Object.fromEntries(q.options.filter((o) => o.explanation).map((o) => [o.id, o.explanation!])),
  };
}

async function loadItemForWrite(userId: string, attemptId: string, questionId: string) {
  const attempt = await loadOwnedAttempt(userId, attemptId);
  if (attempt.status !== "IN_PROGRESS") throw new AttemptError("This session has already been submitted.");
  if (isExpired(attempt)) {
    await submitAttempt(userId, attemptId, { auto: true });
    throw new AttemptError("Time is up — your session was submitted automatically.");
  }
  const item = await db.attemptItem.findUnique({ where: { attemptId_questionId: { attemptId, questionId } }, include: { question: { include: { options: true } } } });
  if (!item) throw new NotFoundError("Question is not part of this session");
  return { attempt, item };
}

export async function saveAnswer(userId: string, attemptId: string, questionId: string, raw: unknown, markedForReview?: boolean) {
  const response = responseSchema.parse(raw ?? {});
  const { attempt, item } = await loadItemForWrite(userId, attemptId, questionId);
  if (!isExamKind(attempt.kind) && item.isCorrect !== null) throw new AttemptError("This answer has already been checked.");
  return db.attemptItem.update({
    where: { id: item.id },
    data: { response: response as Prisma.InputJsonValue, answeredAt: new Date(), ...(markedForReview !== undefined ? { markedForReview } : {}) },
  });
}

export async function toggleReviewMark(userId: string, attemptId: string, questionId: string, marked: boolean) {
  const { item } = await loadItemForWrite(userId, attemptId, questionId);
  return db.attemptItem.update({ where: { id: item.id }, data: { markedForReview: marked } });
}

/** Practice-only: grade a single answer immediately and reveal feedback. Forbidden in exam modes. */
export async function checkAnswer(userId: string, attemptId: string, questionId: string, raw: unknown) {
  const response = responseSchema.parse(raw ?? {});
  const { attempt, item } = await loadItemForWrite(userId, attemptId, questionId);
  if (isExamKind(attempt.kind)) throw new AttemptError("Answers are revealed only after the examination is submitted.");
  if (item.isCorrect !== null) return feedbackFor(item.question, item.isCorrect);
  const g = gradeQuestion(
    { type: item.question.type, options: item.question.options, acceptedAnswers: item.question.acceptedAnswers, keywords: item.question.keywords },
    response,
  );
  if (!g.answered) throw new AttemptError("Select or enter an answer first.");
  await db.attemptItem.update({ where: { id: item.id }, data: { response: response as Prisma.InputJsonValue, isCorrect: g.correct, answeredAt: new Date() } });
  return feedbackFor(item.question, g.correct);
}

export async function submitAttempt(userId: string, attemptId: string, opts: { auto?: boolean } = {}) {
  const attempt = await loadOwnedAttempt(userId, attemptId);
  if (attempt.status !== "IN_PROGRESS") return attempt;
  const now = new Date();
  const expired = isExpired(attempt, now);
  const items = await db.attemptItem.findMany({ where: { attemptId }, include: { question: { include: { options: true, topic: { select: { slug: true } } } } } });
  const graded = items.map((it) => {
    const g = gradeQuestion(
      { type: it.question.type, options: it.question.options, acceptedAnswers: it.question.acceptedAnswers, keywords: it.question.keywords },
      (it.response as QuestionResponse | null) ?? null,
    );
    return { id: it.id, topic: it.question.topic.slug, correct: g.correct };
  });
  const correct = graded.filter((g) => g.correct).length;
  const score = scorePercent(correct, items.length);
  const passingScore = attempt.assessmentId
    ? (await db.assessment.findUnique({ where: { id: attempt.assessmentId }, select: { passingScore: true } }))?.passingScore ?? null
    : null;
  const endedAt = attempt.expiresAt && (expired || now > attempt.expiresAt) ? attempt.expiresAt : now;
  await db.$transaction([
    ...graded.map((g) => db.attemptItem.update({ where: { id: g.id }, data: { isCorrect: g.correct } })),
    db.attempt.update({
      where: { id: attemptId },
      data: {
        status: opts.auto || expired ? "AUTO_SUBMITTED" : "SUBMITTED",
        submittedAt: now,
        durationSeconds: Math.max(0, Math.round((endedAt.getTime() - attempt.startedAt.getTime()) / 1000)),
        correctCount: correct,
        score,
        passed: passingScore != null ? score >= passingScore : null,
        topicBreakdown: topicBreakdown(graded) as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);
  if (attempt.kind === "FINAL" && attempt.courseId) await completeCourseIfEligible(userId, attempt.courseId);
  return db.attempt.findUniqueOrThrow({ where: { id: attemptId } });
}

/** Full review — only available after submission. */
export async function getAttemptResults(userId: string, attemptId: string) {
  const attempt = await loadOwnedAttempt(userId, attemptId);
  if (attempt.status === "IN_PROGRESS") {
    if (!isExpired(attempt)) return null;
    await submitAttempt(userId, attemptId, { auto: true });
  }
  const full = await db.attempt.findUniqueOrThrow({ where: { id: attemptId }, include: { assessment: true } });
  const items = await db.attemptItem.findMany({
    where: { attemptId }, orderBy: { order: "asc" },
    include: { question: { include: { options: { orderBy: { order: "asc" } }, topic: true } } },
  });
  const previous = await db.attempt.findFirst({
    where: { userId, kind: full.kind, mode: full.mode, status: { not: "IN_PROGRESS" }, submittedAt: { lt: full.submittedAt ?? new Date() }, id: { not: full.id } },
    orderBy: { submittedAt: "desc" }, select: { score: true },
  });
  return {
    attempt: full,
    previousScore: previous?.score ?? null,
    breakdown: (full.topicBreakdown as unknown as TopicStat[]) ?? [],
    items: items.map((it) => ({
      order: it.order,
      question: it.question,
      response: (it.response as QuestionResponse | null) ?? null,
      correct: !!it.isCorrect,
      markedForReview: it.markedForReview,
      feedback: feedbackFor(it.question, !!it.isCorrect),
    })),
  };
}

export async function readinessInsights(userId: string, attemptId: string) {
  const res = await getAttemptResults(userId, attemptId);
  if (!res) return null;
  const topics = await db.topic.findMany();
  const name = (slug: string) => topics.find((t) => t.slug === slug)?.name ?? slug;
  const strengths = res.breakdown.filter((b) => b.accuracy >= 75);
  const weak = res.breakdown.filter((b) => b.accuracy < 60).sort((a, b) => a.accuracy - b.accuracy);
  const weakSlugs = weak.map((w) => w.topic);
  const [courses, decks] = await Promise.all([
    db.course.findMany({ where: { status: "PUBLISHED", topic: { slug: { in: weakSlugs } } }, include: { topic: true }, orderBy: { level: "asc" }, take: 4 }),
    db.flashcardDeck.findMany({ where: { status: "PUBLISHED", ownerId: null, topic: { slug: { in: weakSlugs } } }, take: 4 }),
  ]);
  return { ...res, strengths: strengths.map((s) => ({ ...s, name: name(s.topic) })), weak: weak.map((w) => ({ ...w, name: name(w.topic) })), courses, decks, nextTopic: weakSlugs[0] ?? null };
}

export async function attemptHistory(userId: string, kinds?: AttemptKind[], take = 20) {
  return db.attempt.findMany({
    where: { userId, ...(kinds ? { kind: { in: kinds } } : {}) },
    orderBy: { startedAt: "desc" },
    take,
    include: { assessment: { select: { name: true, slug: true } } },
  });
}

export function modeLabel(kind: AttemptKind, mode: string, assessmentName?: string | null) {
  if (assessmentName) return assessmentName;
  if (kind === "DAILY_CHALLENGE") return "Daily Challenge";
  return (PRACTICE_MODES as Record<string, { label: string }>)[mode]?.label ?? "Practice";
}

/** Short knowledge check (3 questions) drawn from the course's question pool. Requires enrolment. */
export async function startKnowledgeCheck(user: Actor, courseId: string, rng: () => number = Math.random) {
  const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
  if (!enrollment) throw new AccessError("Enrol in the course first.");
  const course = await db.course.findUniqueOrThrow({ where: { id: courseId } });
  let ids = (await db.question.findMany({ where: { courseId, status: "PUBLISHED" }, select: { id: true } })).map((q) => q.id);
  if (ids.length < 3) ids = [...ids, ...(await db.question.findMany({ where: { topicId: course.topicId, status: "PUBLISHED", id: { notIn: ids } }, select: { id: true }, take: 10 })).map((q) => q.id)];
  return createAttempt(user.id, { kind: "KNOWLEDGE_CHECK", mode: "KNOWLEDGE_CHECK", courseId, questionIds: shuffle(ids, rng).slice(0, 3), config: { mode: "KNOWLEDGE_CHECK" } });
}
