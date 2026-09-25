import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { makeUser, grantPremium } from "../helpers";
import {
  AttemptError, checkAnswer, getAttemptResults, getAttemptSession, saveAnswer, startAssessment, startPractice, submitAttempt, readinessInsights,
} from "@/server/services/attempts";
import { AccessError, NotFoundError } from "@/server/services/courses";
import { seededRng } from "@/server/services/attempts";

async function correctResponse(questionId: string) {
  const q = await db.question.findUniqueOrThrow({ where: { id: questionId }, include: { options: true } });
  if (q.type === "MATCHING") return { matches: Object.fromEntries(q.options.map((o) => [o.id, o.matchText ?? ""])) };
  if (q.type === "FILL_BLANK") return { text: q.acceptedAnswers[0] };
  if (q.type === "SHORT_ANSWER") return { text: q.modelAnswer ?? "" };
  return { selected: q.options.filter((o) => o.isCorrect).map((o) => o.id) };
}
async function wrongResponse(questionId: string) {
  const q = await db.question.findUniqueOrThrow({ where: { id: questionId }, include: { options: true } });
  if (q.type === "MATCHING") return { matches: Object.fromEntries(q.options.map((o) => [o.id, "nonsense"])) };
  if (q.type === "FILL_BLANK" || q.type === "SHORT_ANSWER") return { text: "definitely wrong" };
  return { selected: [q.options.find((o) => !o.isCorrect)!.id] };
}

describe("practice sessions", () => {
  it("draws only FREE questions for free learners, and the requested count", async () => {
    const u = await makeUser();
    const a = await startPractice(u, { mode: "STANDARD" });
    const items = await db.attemptItem.findMany({ where: { attemptId: a.id }, include: { question: true } });
    expect(items).toHaveLength(10);
    expect(items.every((i) => i.question.accessTier === "FREE" && i.question.status === "PUBLISHED")).toBe(true);
  });

  it("filters by topic and difficulty and randomises selection", async () => {
    const u = await makeUser();
    await grantPremium(u.id);
    const a = await startPractice(u, { mode: "QUICK", topic: "sanctions", rng: seededRng(1) });
    const b = await startPractice(u, { mode: "QUICK", topic: "sanctions", rng: seededRng(2) });
    const qa = await db.attemptItem.findMany({ where: { attemptId: a.id }, include: { question: { include: { topic: true } } } });
    const qb = await db.attemptItem.findMany({ where: { attemptId: b.id } });
    expect(qa).toHaveLength(5);
    expect(qa.every((i) => i.question.topic.slug === "sanctions")).toBe(true);
    expect(qa.map((i) => i.questionId).sort()).not.toEqual(qb.map((i) => i.questionId).sort());
    const d = await startPractice(u, { mode: "DEEP", difficulty: "ADVANCED" });
    const qd = await db.attemptItem.findMany({ where: { attemptId: d.id }, include: { question: true } });
    expect(qd.every((i) => i.question.difficulty === "ADVANCED")).toBe(true);
  });

  it("reveals feedback only after checking, and locks the answer", async () => {
    const u = await makeUser();
    const a = await startPractice(u, { mode: "QUICK" });
    const s = await getAttemptSession(u.id, a.id);
    expect(JSON.stringify(s.questions)).not.toMatch(/isCorrect|"explanation"/);
    expect(s.questions.every((q) => q.feedback === null)).toBe(true);
    const qid = s.questions[0].questionId;
    const fb = await checkAnswer(u.id, a.id, qid, await correctResponse(qid));
    expect(fb.correct).toBe(true);
    expect(fb.explanation.length).toBeGreaterThan(5);
    await expect(saveAnswer(u.id, a.id, qid, await wrongResponse(qid))).rejects.toBeInstanceOf(AttemptError);
    const after = await getAttemptSession(u.id, a.id);
    expect(after.questions.find((q) => q.questionId === qid)!.feedback?.correct).toBe(true);
  });

  it("scores submissions correctly and supports retrying missed questions", async () => {
    const u = await makeUser();
    const a = await startPractice(u, { mode: "QUICK" });
    const items = await db.attemptItem.findMany({ where: { attemptId: a.id }, orderBy: { order: "asc" } });
    // 3 correct, 1 wrong, 1 unanswered
    for (const it of items.slice(0, 3)) await checkAnswer(u.id, a.id, it.questionId, await correctResponse(it.questionId));
    await checkAnswer(u.id, a.id, items[3].questionId, await wrongResponse(items[3].questionId));
    const done = await submitAttempt(u.id, a.id);
    expect(done).toMatchObject({ status: "SUBMITTED", correctCount: 3, totalCount: 5, score: 60 });
    const res = await getAttemptResults(u.id, a.id);
    expect(res!.items.filter((i) => !i.correct)).toHaveLength(2);
    const retry = await startPractice(u, { mode: "INCORRECT_REVIEW" });
    const retryIds = (await db.attemptItem.findMany({ where: { attemptId: retry.id } })).map((i) => i.questionId).sort();
    expect(retryIds).toEqual([items[3].questionId, items[4].questionId].sort());
  });

  it("the daily challenge is the same set for everyone and one attempt per day", async () => {
    const u1 = await makeUser();
    const u2 = await makeUser();
    const a1 = await startPractice(u1, { mode: "DAILY_CHALLENGE" });
    const a1b = await startPractice(u1, { mode: "DAILY_CHALLENGE" });
    const a2 = await startPractice(u2, { mode: "DAILY_CHALLENGE" });
    expect(a1b.id).toBe(a1.id);
    const ids = async (id: string) => (await db.attemptItem.findMany({ where: { attemptId: id }, orderBy: { order: "asc" } })).map((i) => i.questionId);
    expect(await ids(a1.id)).toEqual(await ids(a2.id));
  });

  it("prevents access to other learners' sessions", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const a = await startPractice(owner, { mode: "QUICK" });
    await expect(getAttemptSession(other.id, a.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(submitAttempt(other.id, a.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getAttemptResults(other.id, a.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("mock examinations", () => {
  it("gates premium mock exams and allows the free quick assessment", async () => {
    const u = await makeUser();
    await expect(startAssessment(u, "standard-mock-exam")).rejects.toBeInstanceOf(AccessError);
    const quick = await startAssessment(u, "quick-assessment");
    expect(quick.kind).toBe("MOCK_EXAM");
    expect(quick.timed).toBe(true);
  });

  it("hides answers until submission and forbids instant checking", async () => {
    const u = await makeUser();
    await grantPremium(u.id);
    const a = await startAssessment(u, "standard-mock-exam");
    const s = await getAttemptSession(u.id, a.id);
    expect(s.questions).toHaveLength(50);
    expect(JSON.stringify(s.questions)).not.toMatch(/isCorrect|explanation|acceptedAnswers|modelAnswer|correctOptionIds/);
    await expect(checkAnswer(u.id, a.id, s.questions[0].questionId, { selected: [] })).rejects.toThrow(/after the examination is submitted/);
    expect(await getAttemptResults(u.id, a.id)).toBeNull();
  });

  it("scores an exam exactly and records topic accuracy and pass/fail", async () => {
    const u = await makeUser();
    await grantPremium(u.id);
    const a = await startAssessment(u, "standard-mock-exam");
    const items = await db.attemptItem.findMany({ where: { attemptId: a.id }, orderBy: { order: "asc" } });
    for (const [i, it] of items.entries()) await saveAnswer(u.id, a.id, it.questionId, i < 40 ? await correctResponse(it.questionId) : await wrongResponse(it.questionId), i === 0);
    const done = await submitAttempt(u.id, a.id);
    expect(done.correctCount).toBe(40);
    expect(done.score).toBe(80);
    expect(done.passed).toBe(true);
    const breakdown = done.topicBreakdown as { total: number }[];
    expect(breakdown.reduce((s, b) => s + b.total, 0)).toBe(50);
    expect((await db.attemptItem.findFirstOrThrow({ where: { attemptId: a.id, order: 0 } })).markedForReview).toBe(true);
  });

  it("automatically submits a timed exam when time runs out and rejects late answers", async () => {
    const u = await makeUser();
    const a = await startAssessment(u, "quick-assessment");
    const [first, second] = await db.attemptItem.findMany({ where: { attemptId: a.id }, orderBy: { order: "asc" }, take: 2 });
    await saveAnswer(u.id, a.id, first.questionId, await correctResponse(first.questionId));
    // simulate the clock running out (beyond the 30s grace period)
    await db.attempt.update({ where: { id: a.id }, data: { startedAt: new Date(Date.now() - 26 * 60_000), expiresAt: new Date(Date.now() - 60_000) } });
    await expect(saveAnswer(u.id, a.id, second.questionId, await correctResponse(second.questionId))).rejects.toThrow(/Time is up/);
    const after = await db.attempt.findUniqueOrThrow({ where: { id: a.id } });
    expect(after.status).toBe("AUTO_SUBMITTED");
    expect(after.correctCount).toBe(1);
    expect(after.durationSeconds).toBeLessThanOrEqual(25 * 60 + 1);
    const res = await getAttemptResults(u.id, a.id);
    expect(res!.attempt.status).toBe("AUTO_SUBMITTED");
  });

  it("retakes use a new randomised question set", async () => {
    const u = await makeUser();
    await grantPremium(u.id);
    const a = await startAssessment(u, "standard-mock-exam", {}, seededRng(10));
    const b = await startAssessment(u, "standard-mock-exam", {}, seededRng(20));
    const ids = async (id: string) => (await db.attemptItem.findMany({ where: { attemptId: id }, orderBy: { order: "asc" } })).map((i) => i.questionId);
    expect(await ids(a.id)).not.toEqual(await ids(b.id));
  });

  it("supports configurable advanced assessments", async () => {
    const u = await makeUser();
    await grantPremium(u.id);
    const a = await startAssessment(u, "advanced-professional-assessment", { topics: ["sanctions"], difficulty: null, questionCount: 10, timeLimitMinutes: 0 });
    const items = await db.attemptItem.findMany({ where: { attemptId: a.id }, include: { question: { include: { topic: true } } } });
    expect(items).toHaveLength(10);
    expect(items.every((i) => i.question.topic.slug === "sanctions")).toBe(true);
    expect(a.timed).toBe(false);
    const adv = await startAssessment(u, "advanced-professional-assessment", { topics: ["sanctions"], questionCount: 10 });
    const advItems = await db.attemptItem.findMany({ where: { attemptId: adv.id }, include: { question: true } });
    expect(advItems.every((i) => i.question.difficulty === "ADVANCED")).toBe(true); // template default applies when unspecified
  });

  it("readiness assessment covers multiple topics and produces insights", async () => {
    const u = await makeUser();
    const a = await startAssessment(u, "exam-readiness");
    const items = await db.attemptItem.findMany({ where: { attemptId: a.id }, include: { question: { include: { topic: true } } } });
    expect(new Set(items.map((i) => i.question.topic.slug)).size).toBeGreaterThan(5);
    await submitAttempt(u.id, a.id);
    const r = await readinessInsights(u.id, a.id);
    expect(r!.weak.length).toBeGreaterThan(0);
    expect(r!.nextTopic).toBeTruthy();
  });
});
