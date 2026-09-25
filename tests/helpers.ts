import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import type { Role } from "@/lib/rbac";

export async function makeUser(opts: { role?: Role; email?: string; name?: string; interests?: string[] } = {}) {
  const email = opts.email ?? `t-${randomBytes(6).toString("hex")}@example.test`;
  const u = await db.user.create({ data: { email, name: opts.name ?? "Test User", passwordHash: await hashPassword("Password123!"), role: opts.role ?? "LEARNER", interests: opts.interests ?? [] } });
  return { id: u.id, role: u.role as Role, email: u.email, name: u.name, level: u.level, interests: u.interests };
}

export async function grantPremium(userId: string) {
  const plan = await db.membershipPlan.findUniqueOrThrow({ where: { slug: "premium-annual" } });
  return db.membership.create({ data: { userId, planId: plan.id, source: "ADMIN", endsAt: new Date(Date.now() + 86400_000 * 30) } });
}

export const freeCourseSlug = "aml-cft-fundamentals";
export const premiumCourseSlug = "ofac-50-percent-rule-ownership";
