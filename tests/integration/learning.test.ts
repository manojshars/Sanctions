import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { makeUser, grantPremium, freeCourseSlug, premiumCourseSlug } from "../helpers";
import { exposesSecrets } from "../helpers";
import { AccessError, completeLesson, enroll, getLessonForLearner, saveLessonProgress } from "@/server/services/courses";
import { getCompletionStatus } from "@/server/services/certificates";
import { AttemptError, getAttemptSession, saveAnswer, startFinalAssessment, submitAttempt } from "@/server/services/attempts";
import { AuthError, authenticate, registerUser, requestPasswordReset, resetPassword } from "@/server/services/auth";
import { getEntitlements } from "@/lib/entitlements";
import { hashToken } from "@/lib/auth/tokens";

async function courseBySlug(slug: string) {
  return db.course.findUniqueOrThrow({ where: { slug }, include: { modules: { include: { lessons: true }, orderBy: { order: "asc" } } } });
}

/** Answers every question in an attempt correctly using the server-side answer key (test-only helper). */
async function answerAllCorrectly(userId: string, attemptId: string) {
  const items = await db.attemptItem.findMany({ where: { attemptId }, include: { question: { include: { options: true } } } });
  for (const it of items) {
    const q = it.question;
    const response =
      q.type === "MATCHING" ? { matches: Object.fromEntries(q.options.map((o) => [o.id, o.matchText ?? ""])) }
      : q.type === "FILL_BLANK" ? { text: q.acceptedAnswers[0] }
      : q.type === "SHORT_ANSWER" ? { text: q.modelAnswer ?? q.keywords.map((k) => k.split("|")[0]).join(" ") }
      : { selected: q.options.filter((o) => o.isCorrect).map((o) => o.id) };
    await saveAnswer(userId, attemptId, q.id, response);
  }
}

describe("authentication", () => {
  it("registers, prevents duplicate emails and authenticates", async () => {
    const email = `reg-${Date.now()}@example.test`;
    const u = await registerUser({ name: "New Learner", email, password: "Password123!", level: "BEGINNER", interests: ["sanctions"], acceptTerms: true, marketingOptIn: false });
    expect(u.passwordHash).not.toContain("Password123");
    await expect(registerUser({ name: "Dup", email, password: "Password123!", level: "BEGINNER", interests: [], acceptTerms: true, marketingOptIn: false })).rejects.toBeInstanceOf(AuthError);
    expect((await authenticate(email.toUpperCase(), "Password123!"))?.id).toBe(u.id);
    expect(await authenticate(email, "wrong-password-1")).toBeNull();
    expect(await db.emailLog.count({ where: { to: email, subject: { contains: "Verify" } } })).toBe(1);
  });
  it("blocks suspended accounts", async () => {
    const u = await makeUser();
    await db.user.update({ where: { id: u.id }, data: { status: "SUSPENDED" } });
    expect(await authenticate(u.email, "Password123!")).toBeNull();
  });
  it("password reset tokens are single-use and sign out other sessions", async () => {
    const u = await makeUser();
    await db.session.create({ data: { userId: u.id, tokenHash: hashToken(`s-${u.id}`), expiresAt: new Date(Date.now() + 1e6) } });
    await requestPasswordReset(u.email);
    const mail = await db.emailLog.findFirstOrThrow({ where: { to: u.email, subject: { contains: "Reset" } } });
    const token = new URL(mail.body.match(/https?:\/\/\S+/)![0]).searchParams.get("token")!;
    await resetPassword(token, "BrandNewPass9");
    expect(await authenticate(u.email, "BrandNewPass9")).not.toBeNull();
    expect(await db.session.count({ where: { userId: u.id } })).toBe(0);
    await expect(resetPassword(token, "AnotherPass9")).rejects.toBeInstanceOf(AuthError);
  });
});

describe("enrolment, access control and progress", () => {
  it("free learners can enrol in free courses but not premium ones", async () => {
    const u = await makeUser();
    const free = await courseBySlug(freeCourseSlug);
    const premium = await courseBySlug(premiumCourseSlug);
    await expect(enroll(u, free.id)).resolves.toMatchObject({ userId: u.id, courseId: free.id });
    await expect(enroll(u, premium.id)).rejects.toBeInstanceOf(AccessError);
    await grantPremium(u.id);
    await expect(enroll(u, premium.id)).resolves.toBeTruthy();
    expect((await getEntitlements(u)).allAccess).toBe(true);
  });

  it("requires enrolment to open lessons", async () => {
    const u = await makeUser();
    const c = await courseBySlug(freeCourseSlug);
    const lesson = c.modules[0].lessons[0];
    await expect(getLessonForLearner(u, c.slug, lesson.slug)).rejects.toBeInstanceOf(AccessError);
    await enroll(u, c.id);
    await expect(getLessonForLearner(u, c.slug, lesson.slug)).resolves.toMatchObject({ lesson: { id: lesson.id } });
  });

  it("saves, resumes and completes lessons without losing progress", async () => {
    const u = await makeUser();
    const c = await courseBySlug(freeCourseSlug);
    const lesson = c.modules[0].lessons[0];
    await enroll(u, c.id);
    await saveLessonProgress(u.id, lesson.id, 40);
    await saveLessonProgress(u.id, lesson.id, 20); // never goes backwards
    expect((await db.lessonProgress.findUniqueOrThrow({ where: { userId_lessonId: { userId: u.id, lessonId: lesson.id } } })).progressPercent).toBe(40);
    expect((await db.enrollment.findUniqueOrThrow({ where: { userId_courseId: { userId: u.id, courseId: c.id } } })).lastLessonId).toBe(lesson.id);
    await completeLesson(u.id, lesson.id);
    await saveLessonProgress(u.id, lesson.id, 10);
    const p = await db.lessonProgress.findUniqueOrThrow({ where: { userId_lessonId: { userId: u.id, lessonId: lesson.id } } });
    expect(p.status).toBe("COMPLETED");
    expect(p.progressPercent).toBe(100);
  });

  it("cannot record progress for a course the learner is not enrolled in", async () => {
    const u = await makeUser();
    const c = await courseBySlug(freeCourseSlug);
    await expect(saveLessonProgress(u.id, c.modules[0].lessons[0].id, 50)).rejects.toBeInstanceOf(AccessError);
  });
});

describe("course completion and certificates", () => {
  it("issues a certificate only after all lessons and a passed final assessment", async () => {
    const u = await makeUser({ name: "Certified Learner" });
    const c = await courseBySlug(freeCourseSlug);
    await enroll(u, c.id);
    await expect(startFinalAssessment(u, c.id)).rejects.toBeInstanceOf(AttemptError); // lessons incomplete
    const lessons = c.modules.flatMap((m) => m.lessons);
    for (const l of lessons) await completeLesson(u.id, l.id);
    expect(await db.certificate.count({ where: { userId: u.id } })).toBe(0);

    // A failed attempt does not issue a certificate
    const fail = await startFinalAssessment(u, c.id);
    await submitAttempt(u.id, fail.id);
    expect((await db.attempt.findUniqueOrThrow({ where: { id: fail.id } })).passed).toBe(false);
    expect(await db.certificate.count({ where: { userId: u.id } })).toBe(0);

    const pass = await startFinalAssessment(u, c.id);
    await answerAllCorrectly(u.id, pass.id);
    const done = await submitAttempt(u.id, pass.id);
    expect(done.score).toBe(100);
    expect(done.passed).toBe(true);
    const cert = await db.certificate.findUniqueOrThrow({ where: { userId_courseId: { userId: u.id, courseId: c.id } } });
    expect(cert).toMatchObject({ learnerName: "Certified Learner", courseTitle: c.title, score: 100, status: "VALID" });
    expect((await db.enrollment.findUniqueOrThrow({ where: { userId_courseId: { userId: u.id, courseId: c.id } } })).status).toBe("COMPLETED");
    const status = await getCompletionStatus(u.id, c.id);
    expect(status.eligible).toBe(true);
    await expect(startFinalAssessment(u, c.id)).rejects.toThrow(/already passed/);
    // idempotent: completing a lesson again does not duplicate certificates
    await completeLesson(u.id, lessons[0].id);
    expect(await db.certificate.count({ where: { userId: u.id } })).toBe(1);
  });

  it("enforces the retake limit", async () => {
    const u = await makeUser();
    const c = await courseBySlug(freeCourseSlug);
    await enroll(u, c.id);
    for (const l of c.modules.flatMap((m) => m.lessons)) await completeLesson(u.id, l.id);
    for (let i = 0; i < c.maxAttempts; i++) {
      const a = await startFinalAssessment(u, c.id);
      await submitAttempt(u.id, a.id);
    }
    await expect(startFinalAssessment(u, c.id)).rejects.toThrow(/used all/);
  });

  it("does not expose answer keys in the final assessment session", async () => {
    const u = await makeUser();
    const c = await courseBySlug(freeCourseSlug);
    await enroll(u, c.id);
    for (const l of c.modules.flatMap((m) => m.lessons)) await completeLesson(u.id, l.id);
    const a = await startFinalAssessment(u, c.id);
    const s = await getAttemptSession(u.id, a.id);
    expect(exposesSecrets(s.questions)).toBe(false);
  });
});
