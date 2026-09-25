import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { assertCan, type Role } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/email";
import { NotFoundError } from "../courses";
import { AdminInputError } from "./content";

type Actor = { id: string; role: Role };

export async function listUsers(actor: Actor, f: { q?: string; role?: string; status?: string; page?: number }) {
  assertCan(actor.role, "users:manage");
  const where: Prisma.UserWhereInput = {};
  if (f.q) where.OR = [{ email: { contains: f.q, mode: "insensitive" } }, { name: { contains: f.q, mode: "insensitive" } }];
  if (f.role) where.role = f.role as Role;
  if (f.status) where.status = f.status as never;
  const page = Math.max(1, f.page ?? 1);
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 25, take: 25, include: { _count: { select: { enrollments: true, tickets: true } }, memberships: { where: { status: "ACTIVE" }, include: { plan: true, package: true } } } }),
  ]);
  return { total, users, page, pages: Math.max(1, Math.ceil(total / 25)) };
}

export async function setUserRole(actor: Actor, userId: string, role: Role) {
  assertCan(actor.role, "users:manage");
  z.enum(["LEARNER", "EDITOR", "SUPPORT", "ADMIN"]).parse(role);
  if (userId === actor.id) throw new AdminInputError("You cannot change your own role.");
  const u = await db.user.findUnique({ where: { id: userId } });
  if (!u) throw new NotFoundError("User not found");
  await db.user.update({ where: { id: userId }, data: { role } });
  await db.session.deleteMany({ where: { userId } }); // force re-authentication with new privileges
  await audit(actor.id, "user.role", "User", userId, { from: u.role, to: role });
}

export async function setUserStatus(actor: Actor, userId: string, status: "ACTIVE" | "SUSPENDED") {
  assertCan(actor.role, "users:manage");
  if (userId === actor.id) throw new AdminInputError("You cannot change your own account status.");
  await db.user.update({ where: { id: userId }, data: { status } });
  if (status === "SUSPENDED") await db.session.deleteMany({ where: { userId } });
  await audit(actor.id, `user.${status.toLowerCase()}`, "User", userId);
}

export async function grantMembership(actor: Actor, userId: string, input: { kind: "plan" | "package"; slug: string; days?: number | null; source?: "ADMIN" | "SCHOLARSHIP" }) {
  assertCan(actor.role, "memberships:manage");
  const endsAt = input.days ? new Date(Date.now() + input.days * 86400_000) : null;
  let data: Prisma.MembershipUncheckedCreateInput;
  if (input.kind === "plan") {
    const plan = await db.membershipPlan.findUnique({ where: { slug: input.slug } });
    if (!plan) throw new NotFoundError("Plan not found");
    data = { userId, planId: plan.id, source: input.source ?? "ADMIN", endsAt };
  } else {
    const pkg = await db.learningPackage.findUnique({ where: { slug: input.slug } });
    if (!pkg) throw new NotFoundError("Package not found");
    data = { userId, packageId: pkg.id, source: input.source ?? "ADMIN", endsAt: endsAt ?? new Date(Date.now() + pkg.durationDays * 86400_000) };
  }
  const m = await db.membership.create({ data });
  await notify(userId, "Membership updated", "Your access has been updated by our team.", "/settings/billing");
  await audit(actor.id, "membership.grant", "Membership", m.id, { userId, ...input });
  return m;
}

export async function grantOrgMembership(actor: Actor, orgId: string, days: number) {
  assertCan(actor.role, "memberships:manage");
  const plan = await db.membershipPlan.findUnique({ where: { slug: "corporate" } });
  if (!plan) throw new NotFoundError("Corporate plan not found");
  const m = await db.membership.create({ data: { orgId, planId: plan.id, source: "ADMIN", endsAt: new Date(Date.now() + days * 86400_000) } });
  await audit(actor.id, "membership.grant_org", "Membership", m.id, { orgId, days });
  return m;
}

export async function revokeMembership(actor: Actor, membershipId: string) {
  assertCan(actor.role, "memberships:manage");
  await db.membership.update({ where: { id: membershipId }, data: { status: "CANCELED", endsAt: new Date() } });
  await audit(actor.id, "membership.revoke", "Membership", membershipId);
}

export async function adminEnroll(actor: Actor, userId: string, courseId: string) {
  assertCan(actor.role, "users:manage");
  const e = await db.enrollment.upsert({ where: { userId_courseId: { userId, courseId } }, update: {}, create: { userId, courseId, source: "ADMIN" } });
  await audit(actor.id, "enrollment.admin", "Enrollment", e.id, { userId, courseId });
  return e;
}

// ───────── Plans, packages, coupons, fee assistance, settings ─────────

export const planUpdateSchema = z.object({ priceCents: z.coerce.number().int().min(0).max(10_000_000), description: z.string().trim().min(3).max(300), features: z.string(), isActive: z.boolean(), stripePriceId: z.string().trim().max(100).optional().nullable() });

export async function updatePlan(actor: Actor, id: string, raw: unknown) {
  assertCan(actor.role, "packages:manage");
  const d = planUpdateSchema.parse(raw);
  const p = await db.membershipPlan.update({ where: { id }, data: { ...d, stripePriceId: d.stripePriceId || null, features: d.features.split("\n").map((s) => s.trim()).filter(Boolean) } });
  await audit(actor.id, "plan.update", "MembershipPlan", id, { priceCents: d.priceCents, isActive: d.isActive });
  return p;
}

export const packageUpdateSchema = z.object({ name: z.string().trim().min(2).max(120), priceCents: z.coerce.number().int().min(0).max(10_000_000), durationDays: z.coerce.number().int().min(1).max(3650), description: z.string().trim().min(3).max(500), features: z.string(), topicSlugs: z.array(z.string()), entitlements: z.array(z.string()), isActive: z.boolean() });

export async function updatePackage(actor: Actor, id: string | null, raw: unknown) {
  assertCan(actor.role, "packages:manage");
  const d = packageUpdateSchema.parse(raw);
  const courses = d.topicSlugs.length ? await db.course.findMany({ where: { topic: { slug: { in: d.topicSlugs } } }, select: { id: true } }) : await db.course.findMany({ select: { id: true } });
  const data = { ...d, features: d.features.split("\n").map((s) => s.trim()).filter(Boolean) };
  const p = id
    ? await db.learningPackage.update({ where: { id }, data: { ...data, courses: { set: courses } } })
    : await db.learningPackage.create({ data: { ...data, slug: `${d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`, courses: { connect: courses } } });
  await audit(actor.id, id ? "package.update" : "package.create", "LearningPackage", p.id);
  return p;
}

export const couponSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,32}$/, "Codes use 3–32 letters, numbers, - or _."),
  description: z.string().trim().max(200).optional().nullable(),
  percentOff: z.preprocess((v) => (v === "" ? null : v), z.coerce.number().int().min(1).max(100).nullable()),
  amountOffCents: z.preprocess((v) => (v === "" ? null : v), z.coerce.number().int().min(1).max(10_000_000).nullable()),
  maxRedemptions: z.preprocess((v) => (v === "" ? null : v), z.coerce.number().int().min(1).nullable()),
  expiresAt: z.preprocess((v) => (v === "" ? null : v), z.coerce.date().nullable()),
}).refine((c) => !!c.percentOff !== !!c.amountOffCents, "Set either a percentage or a fixed amount.");

export async function createCoupon(actor: Actor, raw: unknown) {
  assertCan(actor.role, "packages:manage");
  const d = couponSchema.parse(raw);
  if (await db.coupon.findUnique({ where: { code: d.code } })) throw new AdminInputError("A coupon with this code already exists.");
  const c = await db.coupon.create({ data: d });
  await audit(actor.id, "coupon.create", "Coupon", c.id, { code: d.code });
  return c;
}

export async function toggleCoupon(actor: Actor, id: string, isActive: boolean) {
  assertCan(actor.role, "packages:manage");
  await db.coupon.update({ where: { id }, data: { isActive } });
  await audit(actor.id, isActive ? "coupon.enable" : "coupon.disable", "Coupon", id);
}

export async function reviewFeeAssistance(actor: Actor, id: string, decision: "APPROVED" | "REJECTED", discountPct?: number) {
  assertCan(actor.role, "memberships:manage");
  const setting = await db.setting.findUnique({ where: { key: "feeAssistance" } });
  const max = (setting?.value as { maxDiscountPct?: number } | null)?.maxDiscountPct ?? 50;
  if (decision === "APPROVED" && (!discountPct || discountPct < 1 || discountPct > max)) throw new AdminInputError(`Approved discounts must be between 1% and ${max}%.`);
  const r = await db.feeAssistanceRequest.update({ where: { id }, data: { status: decision, discountPct: decision === "APPROVED" ? discountPct : null, reviewedAt: new Date() } });
  await notify(r.userId, decision === "APPROVED" ? "Fee assistance approved" : "Fee assistance update", decision === "APPROVED" ? `A ${discountPct}% discount will be applied at checkout.` : "Your application was not approved at this time.", "/pricing");
  await audit(actor.id, `fee_assistance.${decision.toLowerCase()}`, "FeeAssistanceRequest", id, { discountPct });
  return r;
}

export async function updateSetting(actor: Actor, key: string, value: Prisma.InputJsonValue) {
  assertCan(actor.role, "packages:manage");
  await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  await audit(actor.id, "setting.update", "Setting", key, value);
}
