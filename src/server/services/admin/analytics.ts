import { db } from "@/lib/db";
import { ticketMetrics } from "../support";

/** Platform metrics computed directly from the database — no estimates or placeholders. */
export async function platformAnalytics(now = new Date()) {
  const d30 = new Date(now.getTime() - 30 * 86400_000);
  const [
    users, newUsers, activeAttemptUsers, activeLessonUsers, enrollments, completions, byKind, revenue, revenue30,
    activePaid, topicEnroll, topicAttempts, topics, ticket, certificates, questions, openInquiries, pendingAssistance,
  ] = await Promise.all([
    db.user.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { createdAt: { gte: d30 } } }),
    db.attempt.findMany({ where: { startedAt: { gte: d30 } }, select: { userId: true }, distinct: ["userId"] }),
    db.lessonProgress.findMany({ where: { lastViewedAt: { gte: d30 } }, select: { userId: true }, distinct: ["userId"] }),
    db.enrollment.count(),
    db.enrollment.count({ where: { status: "COMPLETED" } }),
    db.attempt.groupBy({ by: ["kind"], where: { status: { not: "IN_PROGRESS" } }, _avg: { score: true }, _count: true }),
    db.payment.aggregate({ where: { status: "SUCCEEDED", provider: { not: "development" } }, _sum: { amountCents: true } }),
    db.payment.aggregate({ where: { status: "SUCCEEDED", provider: { not: "development" }, paidAt: { gte: d30 } }, _sum: { amountCents: true } }),
    db.membership.count({ where: { status: "ACTIVE", source: "PURCHASE", OR: [{ endsAt: null }, { endsAt: { gt: now } }] } }),
    db.enrollment.findMany({ select: { course: { select: { topicId: true } } } }),
    db.attemptItem.findMany({ where: { isCorrect: { not: null } }, select: { question: { select: { topicId: true } } } }),
    db.topic.findMany({ orderBy: { order: "asc" } }),
    ticketMetrics(),
    db.certificate.count({ where: { status: "VALID" } }),
    db.question.groupBy({ by: ["status"], _count: true }),
    db.inquiry.count({ where: { status: "NEW" } }),
    db.feeAssistanceRequest.count({ where: { status: "NEW" } }),
  ]);
  const devRevenue = await db.payment.aggregate({ where: { status: "SUCCEEDED", provider: "development" }, _sum: { amountCents: true }, _count: true });
  const active = new Set([...activeAttemptUsers.map((a) => a.userId), ...activeLessonUsers.map((a) => a.userId)]);
  const popular = topics.map((t) => ({
    name: t.name,
    enrollments: topicEnroll.filter((e) => e.course.topicId === t.id).length,
    answers: topicAttempts.filter((a) => a.question.topicId === t.id).length,
  })).sort((a, b) => b.enrollments + b.answers - (a.enrollments + a.answers));
  return {
    users, newUsers, activeLearners: active.size, enrollments, completions,
    completionRate: enrollments ? Math.round((completions / enrollments) * 100) : 0,
    assessments: byKind.map((k) => ({ kind: k.kind, count: k._count, avgScore: k._avg.score != null ? Math.round(k._avg.score) : null })),
    revenueCents: revenue._sum.amountCents ?? 0, revenue30Cents: revenue30._sum.amountCents ?? 0, activePaid,
    devPayments: { count: devRevenue._count, cents: devRevenue._sum.amountCents ?? 0 },
    popular, ticket, certificates,
    questions: Object.fromEntries(questions.map((q) => [q.status, q._count])) as Record<string, number>,
    openInquiries, pendingAssistance,
  };
}
