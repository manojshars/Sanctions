import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { notify } from "@/lib/email";

export function generateCertificateNumber(date = new Date()): string {
  return `FCA-${date.getUTCFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function generateVerificationCode(): string {
  // 12 chars, unambiguous alphabet
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("").replace(/(.{4})(?=.)/g, "$1-");
}

export interface CompletionStatus {
  totalLessons: number;
  completedLessons: number;
  lessonsComplete: boolean;
  finalRequired: boolean;
  finalPassed: boolean;
  bestFinalScore: number | null;
  attemptsUsed: number;
  maxAttempts: number;
  eligible: boolean;
}

export async function getCompletionStatus(userId: string, courseId: string): Promise<CompletionStatus> {
  const course = await db.course.findUniqueOrThrow({ where: { id: courseId }, include: { assessments: true } });
  const totalLessons = await db.lesson.count({ where: { module: { courseId } } });
  const completedLessons = await db.lessonProgress.count({ where: { userId, status: "COMPLETED", lesson: { module: { courseId } } } });
  const final = course.assessments.find((a) => a.type === "FINAL");
  const finalAttempts = final
    ? await db.attempt.findMany({ where: { userId, assessmentId: final.id, status: { not: "IN_PROGRESS" } }, select: { score: true, passed: true } })
    : [];
  const finalPassed = finalAttempts.some((a) => a.passed);
  const best = finalAttempts.reduce<number | null>((m, a) => (a.score != null && (m == null || a.score > m) ? a.score : m), null);
  const lessonsComplete = totalLessons > 0 && completedLessons >= totalLessons;
  return {
    totalLessons, completedLessons, lessonsComplete,
    finalRequired: !!final, finalPassed, bestFinalScore: best,
    attemptsUsed: finalAttempts.length, maxAttempts: course.maxAttempts,
    eligible: lessonsComplete && (!final || finalPassed),
  };
}

/**
 * Marks the enrolment complete and issues a certificate when all requirements are met.
 * Idempotent: returns the existing certificate if already issued. Server-side only.
 */
export async function completeCourseIfEligible(userId: string, courseId: string) {
  const status = await getCompletionStatus(userId, courseId);
  if (!status.eligible) return { completed: false, certificate: null, status };
  const [course, user] = await Promise.all([
    db.course.findUniqueOrThrow({ where: { id: courseId } }),
    db.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);
  await db.enrollment.updateMany({ where: { userId, courseId, status: "ACTIVE" }, data: { status: "COMPLETED", completedAt: new Date() } });
  if (!course.hasCertificate) return { completed: true, certificate: null, status };
  const existing = await db.certificate.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (existing) return { completed: true, certificate: existing, status };
  const certificate = await db.certificate.create({
    data: {
      userId, courseId, number: generateCertificateNumber(), verificationCode: generateVerificationCode(),
      learnerName: user.name, courseTitle: course.title, score: status.bestFinalScore, cpdHours: course.cpdHours,
    },
  });
  await notify(userId, "Certificate issued", `Congratulations — your certificate for ${course.title} is ready.`, `/certificates/${certificate.id}`);
  return { completed: true, certificate, status };
}
