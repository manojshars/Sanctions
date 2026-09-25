import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { hashPassword, passwordIssues, verifyPassword } from "@/lib/auth/password";
import { audit } from "@/lib/audit";

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  headline: z.string().trim().max(160).optional().default(""),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  interests: z.array(z.string().max(60)).max(15),
  marketingOptIn: z.boolean(),
});

export async function updateProfile(userId: string, input: z.infer<typeof profileSchema>) {
  const d = profileSchema.parse(input);
  const topics = new Set((await db.topic.findMany({ select: { slug: true } })).map((t) => t.slug));
  return db.user.update({ where: { id: userId }, data: { ...d, headline: d.headline || null, interests: d.interests.filter((i) => topics.has(i)) } });
}

export class AccountError extends Error {}

export async function changePassword(userId: string, current: string, next: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(current, user.passwordHash))) throw new AccountError("Your current password is incorrect.");
  const issues = passwordIssues(next);
  if (issues.length) throw new AccountError(issues[0]);
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(next) } });
}

/** Everything we hold about a learner, as portable JSON (GDPR-style access/portability). */
export async function exportUserData(userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, headline: true, role: true, level: true, interests: true, marketingOptIn: true, emailVerifiedAt: true, createdAt: true, lastLoginAt: true,
      enrollments: { include: { course: { select: { title: true, slug: true } } } },
      lessonProgress: { include: { lesson: { select: { title: true } } } },
      attempts: { include: { items: { select: { questionId: true, response: true, isCorrect: true, markedForReview: true, answeredAt: true } } } },
      bookmarks: true, flashcardReviews: true, flashcardReviewLogs: true, videoProgress: true, caseAttempts: true, certificates: true,
      tickets: { include: { messages: { where: { isInternal: false }, select: { body: true, createdAt: true, authorId: true } } } },
      memberships: true, payments: true, notifications: true, reviews: true, orgMemberships: { include: { org: { select: { name: true } } } }, feeAssistance: true,
      ownedDecks: { include: { cards: true } },
    },
  });
  await audit(userId, "account.export", "User", userId);
  return { exportedAt: new Date().toISOString(), format: "FinCrime Academy data export v1", user };
}

/**
 * Deletes an account: personal and learning data are erased; the user row is anonymised so that
 * financial records (payments/invoices) required for statutory retention remain consistent.
 */
export async function deleteAccount(userId: string, password: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(password, user.passwordHash))) throw new AccountError("Password is incorrect.");
  if (user.role === "ADMIN" && (await db.user.count({ where: { role: "ADMIN", status: "ACTIVE" } })) <= 1) throw new AccountError("The last administrator account cannot be deleted.");
  await db.$transaction([
    db.session.deleteMany({ where: { userId } }),
    db.notification.deleteMany({ where: { userId } }),
    db.bookmark.deleteMany({ where: { userId } }),
    db.videoProgress.deleteMany({ where: { userId } }),
    db.flashcardReviewLog.deleteMany({ where: { userId } }),
    db.flashcardReview.deleteMany({ where: { userId } }),
    db.flashcardDeck.deleteMany({ where: { ownerId: userId } }),
    db.caseAttempt.deleteMany({ where: { userId } }),
    db.attempt.deleteMany({ where: { userId } }),
    db.lessonProgress.deleteMany({ where: { userId } }),
    db.enrollment.deleteMany({ where: { userId } }),
    db.certificate.deleteMany({ where: { userId } }),
    db.courseReview.deleteMany({ where: { userId } }),
    db.corporateAssignment.deleteMany({ where: { userId } }),
    db.organizationMember.deleteMany({ where: { userId } }),
    db.feeAssistanceRequest.deleteMany({ where: { userId } }),
    db.supportTicket.deleteMany({ where: { userId } }),
    db.membership.updateMany({ where: { userId, status: "ACTIVE" }, data: { status: "CANCELED", endsAt: new Date() } }),
    db.user.update({
      where: { id: userId },
      data: { status: "DELETED", email: `deleted-${userId}@deleted.invalid`, name: "Deleted user", headline: null, interests: [], marketingOptIn: false, passwordHash: randomBytes(32).toString("hex") },
    }),
  ]);
  await audit(null, "account.delete", "User", userId);
}
