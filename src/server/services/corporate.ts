import { z } from "zod";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { notify, sendEmail } from "@/lib/email";
import { appUrl, slugify } from "@/lib/utils";
import { AccessError, NotFoundError } from "./courses";
import { courseProgressFor } from "./courses";

/**
 * Tenant isolation: every corporate operation is scoped to an orgId AND verifies that the actor is a
 * MANAGER of that org. Learner lookups are constrained to members of the same org, so one organisation
 * can never read or modify another organisation's data (see tests/integration/corporate.test.ts).
 */
export async function requireManager(actorId: string, orgId: string) {
  const m = await db.organizationMember.findUnique({ where: { orgId_userId: { orgId, userId: actorId } } });
  if (!m || m.role !== "MANAGER") throw new AccessError("You are not a manager of this organisation.");
  return m;
}

export async function managedOrgs(userId: string) {
  return db.organization.findMany({ where: { members: { some: { userId, role: "MANAGER" } } }, orderBy: { name: "asc" } });
}

export const orgSchema = z.object({ name: z.string().trim().min(2).max(120), industry: z.string().trim().max(80).optional() });

export async function createOrganization(userId: string, input: z.infer<typeof orgSchema>) {
  const d = orgSchema.parse(input);
  const slug = `${slugify(d.name)}-${Date.now().toString(36)}`;
  return db.organization.create({ data: { name: d.name, industry: d.industry || null, slug, members: { create: { userId, role: "MANAGER" } } } });
}

export async function inviteMember(actorId: string, orgId: string, emailRaw: string, role: "MANAGER" | "MEMBER" = "MEMBER") {
  await requireManager(actorId, orgId);
  const email = z.string().trim().toLowerCase().email().parse(emailRaw);
  const org = await db.organization.findUniqueOrThrow({ where: { id: orgId }, include: { _count: { select: { members: true } } } });
  const pending = await db.orgInvitation.count({ where: { orgId, acceptedAt: null, expiresAt: { gt: new Date() } } });
  if (org._count.members + pending >= org.seatLimit) throw new AccessError(`Seat limit reached (${org.seatLimit}). Contact us to add seats.`);
  const existing = await db.user.findUnique({ where: { email } });
  if (existing && (await db.organizationMember.findUnique({ where: { orgId_userId: { orgId, userId: existing.id } } }))) throw new AccessError("This person is already a member.");
  const token = generateToken();
  await db.orgInvitation.create({ data: { orgId, email, role, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 14 * 86400_000) } });
  await sendEmail(email, `Join ${org.name} on FinCrime Academy`, `You have been invited to join ${org.name}'s training programme.\n\nAccept: ${appUrl(`/corporate/join?token=${token}`)}\n\nThis invitation expires in 14 days.`);
  return { token };
}

export async function acceptInvitation(userId: string, token: string) {
  const inv = await db.orgInvitation.findUnique({ where: { tokenHash: hashToken(token) }, include: { org: true } });
  if (!inv || inv.acceptedAt || inv.expiresAt < new Date()) throw new NotFoundError("This invitation is invalid or has expired.");
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.email.toLowerCase() !== inv.email.toLowerCase()) throw new AccessError(`This invitation was sent to ${inv.email}. Sign in with that email to accept it.`);
  await db.$transaction([
    db.organizationMember.upsert({ where: { orgId_userId: { orgId: inv.orgId, userId } }, update: {}, create: { orgId: inv.orgId, userId, role: inv.role } }),
    db.orgInvitation.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } }),
  ]);
  return inv.org;
}

export async function removeMember(actorId: string, orgId: string, userId: string) {
  await requireManager(actorId, orgId);
  if (actorId === userId) throw new AccessError("You cannot remove yourself.");
  const m = await db.organizationMember.findUnique({ where: { orgId_userId: { orgId, userId } } });
  if (!m) throw new NotFoundError("Member not found in this organisation.");
  await db.$transaction([
    db.corporateAssignment.deleteMany({ where: { orgId, userId } }),
    db.organizationMember.delete({ where: { id: m.id } }),
  ]);
}

export const assignSchema = z.object({
  courseId: z.string().min(1),
  userIds: z.array(z.string().min(1)).min(1, "Select at least one learner.").max(500),
  dueDate: z.coerce.date().optional().nullable(),
});

export async function assignCourse(actorId: string, orgId: string, input: z.infer<typeof assignSchema>) {
  await requireManager(actorId, orgId);
  const d = assignSchema.parse(input);
  const course = await db.course.findFirst({ where: { id: d.courseId, status: "PUBLISHED" } });
  if (!course) throw new NotFoundError("Course not found");
  const members = await db.organizationMember.findMany({ where: { orgId, userId: { in: d.userIds } }, select: { userId: true } });
  if (members.length !== new Set(d.userIds).size) throw new AccessError("All learners must be members of this organisation.");
  for (const { userId } of members) {
    await db.corporateAssignment.upsert({
      where: { orgId_userId_courseId: { orgId, userId, courseId: course.id } },
      update: { dueDate: d.dueDate ?? null },
      create: { orgId, userId, courseId: course.id, assignedById: actorId, dueDate: d.dueDate ?? null },
    });
    await db.enrollment.upsert({ where: { userId_courseId: { userId, courseId: course.id } }, update: {}, create: { userId, courseId: course.id, source: "CORPORATE" } });
    await notify(userId, "New course assigned", `${course.title}${d.dueDate ? ` — due ${d.dueDate.toLocaleDateString("en-GB")}` : ""}`, `/academy/courses/${course.slug}`);
  }
  return members.length;
}

export async function orgReport(actorId: string, orgId: string) {
  await requireManager(actorId, orgId);
  const [org, members, assignments] = await Promise.all([
    db.organization.findUniqueOrThrow({ where: { id: orgId }, include: { memberships: { where: { status: "ACTIVE" }, include: { plan: true } } } }),
    db.organizationMember.findMany({ where: { orgId }, include: { user: { select: { id: true, name: true, email: true, lastLoginAt: true } } }, orderBy: { joinedAt: "asc" } }),
    db.corporateAssignment.findMany({ where: { orgId }, include: { course: { select: { id: true, title: true, slug: true } } } }),
  ]);
  const memberIds = members.map((m) => m.userId);
  const courseIds = [...new Set(assignments.map((a) => a.courseId))];
  const [enrollments, finals, attempts] = await Promise.all([
    db.enrollment.findMany({ where: { userId: { in: memberIds }, courseId: { in: courseIds } } }),
    db.attempt.findMany({ where: { userId: { in: memberIds }, kind: "FINAL", courseId: { in: courseIds }, status: { not: "IN_PROGRESS" } }, select: { userId: true, courseId: true, score: true, passed: true } }),
    db.attempt.findMany({ where: { userId: { in: memberIds }, status: { not: "IN_PROGRESS" }, kind: { in: ["PRACTICE", "MOCK_EXAM", "READINESS", "FINAL"] } }, select: { userId: true, score: true } }),
  ]);
  const progressByUser = new Map<string, Awaited<ReturnType<typeof courseProgressFor>>>();
  for (const uid of memberIds) progressByUser.set(uid, await courseProgressFor(uid, courseIds));
  const now = new Date();
  const rows = assignments.map((a) => {
    const e = enrollments.find((x) => x.userId === a.userId && x.courseId === a.courseId);
    const f = finals.filter((x) => x.userId === a.userId && x.courseId === a.courseId);
    const best = f.reduce<number | null>((m, x) => (x.score != null && (m == null || x.score > m) ? x.score : m), null);
    const member = members.find((m) => m.userId === a.userId)!;
    const completed = e?.status === "COMPLETED";
    return {
      assignmentId: a.id, userId: a.userId, name: member.user.name, email: member.user.email, course: a.course, dueDate: a.dueDate,
      enrolled: !!e, completed, completedAt: e?.completedAt ?? null, progressPct: progressByUser.get(a.userId)?.[a.courseId]?.pct ?? 0,
      bestFinalScore: best, passed: f.some((x) => x.passed), overdue: !completed && !!a.dueDate && a.dueDate < now,
    };
  });
  const memberStats = members.map((m) => {
    const mine = attempts.filter((x) => x.userId === m.userId && x.score != null);
    return { ...m, assessments: mine.length, avgScore: mine.length ? Math.round(mine.reduce((s, x) => s + (x.score ?? 0), 0) / mine.length) : null, assigned: rows.filter((r) => r.userId === m.userId).length, completed: rows.filter((r) => r.userId === m.userId && r.completed).length };
  });
  return {
    org, members: memberStats, rows,
    summary: { learners: members.length, assignments: rows.length, completed: rows.filter((r) => r.completed).length, overdue: rows.filter((r) => r.overdue).length, completionRate: rows.length ? Math.round((rows.filter((r) => r.completed).length / rows.length) * 100) : 0 },
    invitations: await db.orgInvitation.findMany({ where: { orgId, acceptedAt: null, expiresAt: { gt: now } }, orderBy: { createdAt: "desc" } }),
  };
}

export function reportToCsv(rows: Awaited<ReturnType<typeof orgReport>>["rows"]): string {
  const esc = (v: unknown) => { let s = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const header = ["Learner", "Email", "Course", "Due date", "Enrolled", "Progress %", "Completed", "Completed at", "Best final score", "Passed", "Overdue"];
  const lines = rows.map((r) => [r.name, r.email, r.course.title, r.dueDate?.toISOString().slice(0, 10), r.enrolled, r.progressPct, r.completed, r.completedAt?.toISOString().slice(0, 10), r.bestFinalScore, r.passed, r.overdue].map(esc).join(","));
  return [header.join(","), ...lines].join("\n");
}
