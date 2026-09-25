import { db } from "@/lib/db";
import type { Role } from "@/lib/rbac";
import { isStaff } from "@/lib/rbac";

/**
 * Entitlements are always computed on the server from the database (memberships, packages,
 * organisation plans, corporate assignments). Clients cannot grant themselves access.
 */
export type Feature =
  | "FULL_QUESTION_BANK"
  | "MOCK_EXAMS"
  | "FULL_FLASHCARDS"
  | "ANALYTICS"
  | "ADVANCED_CASES"
  | "DOWNLOADS"
  | "PREMIUM_VIDEOS";

export const ALL_FEATURES: Feature[] = [
  "FULL_QUESTION_BANK",
  "MOCK_EXAMS",
  "FULL_FLASHCARDS",
  "ANALYTICS",
  "ADVANCED_CASES",
  "DOWNLOADS",
  "PREMIUM_VIDEOS",
];

export interface Entitlements {
  tier: "GUEST" | "FREE" | "PREMIUM" | "CORPORATE" | "STAFF";
  allAccess: boolean;
  topicSlugs: Set<string>;
  courseIds: Set<string>;
  features: Set<Feature>;
  packageNames: string[];
}

export const GUEST_ENTITLEMENTS: Entitlements = {
  tier: "GUEST",
  allAccess: false,
  topicSlugs: new Set(),
  courseIds: new Set(),
  features: new Set(),
  packageNames: [],
};

type Accessible = { accessTier: "FREE" | "PREMIUM" };

export async function getEntitlements(user: { id: string; role: Role } | null, now = new Date()): Promise<Entitlements> {
  if (!user) return GUEST_ENTITLEMENTS;
  if (isStaff(user.role)) {
    return { tier: "STAFF", allAccess: true, topicSlugs: new Set(), courseIds: new Set(), features: new Set(ALL_FEATURES), packageNames: [] };
  }

  const orgIds = (await db.organizationMember.findMany({ where: { userId: user.id }, select: { orgId: true } })).map((m) => m.orgId);

  const memberships = await db.membership.findMany({
    where: {
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      AND: [{ OR: [{ userId: user.id }, ...(orgIds.length ? [{ orgId: { in: orgIds } }] : [])] }],
    },
    include: { plan: true, package: { include: { courses: { select: { id: true } } } } },
  });

  const ent: Entitlements = {
    tier: "FREE",
    allAccess: false,
    topicSlugs: new Set(),
    courseIds: new Set(),
    features: new Set(),
    packageNames: [],
  };

  for (const m of memberships) {
    if (m.plan && (m.plan.tier === "PREMIUM" || m.plan.tier === "CORPORATE")) {
      ent.allAccess = true;
      ALL_FEATURES.forEach((f) => ent.features.add(f));
      ent.tier = m.plan.tier === "CORPORATE" || m.orgId ? "CORPORATE" : ent.tier === "CORPORATE" ? "CORPORATE" : "PREMIUM";
    }
    if (m.package) {
      ent.packageNames.push(m.package.name);
      m.package.topicSlugs.forEach((t) => ent.topicSlugs.add(t));
      m.package.courses.forEach((c) => ent.courseIds.add(c.id));
      m.package.entitlements.forEach((f) => ent.features.add(f as Feature));
      if (m.package.topicSlugs.length === 0 && m.package.entitlements.length >= ALL_FEATURES.length) ent.allAccess = true;
      if (ent.tier === "FREE") ent.tier = "PREMIUM";
    }
  }

  // Corporate assignments always grant access to the assigned course.
  const assignments = await db.corporateAssignment.findMany({ where: { userId: user.id }, select: { courseId: true } });
  assignments.forEach((a) => ent.courseIds.add(a.courseId));

  return ent;
}

export function canAccessTopicContent(ent: Entitlements, item: Accessible & { topicSlug?: string | null }): boolean {
  if (item.accessTier === "FREE") return true;
  if (ent.allAccess) return true;
  return !!item.topicSlug && ent.topicSlugs.has(item.topicSlug);
}

export function canAccessCourse(ent: Entitlements, course: Accessible & { id: string; topicSlug: string }): boolean {
  return canAccessTopicContent(ent, course) || ent.courseIds.has(course.id);
}

export function hasFeature(ent: Entitlements, feature: Feature, topicSlug?: string): boolean {
  if (ent.allAccess) return true;
  if (!ent.features.has(feature)) return false;
  // Package features are scoped to the package topics when a topic is given.
  if (topicSlug && ent.topicSlugs.size > 0) return ent.topicSlugs.has(topicSlug);
  return true;
}

/** Which access tiers of questions/cards the user may draw from for a topic. */
export function allowedTiers(ent: Entitlements, topicSlug?: string): ("FREE" | "PREMIUM")[] {
  if (ent.allAccess) return ["FREE", "PREMIUM"];
  if (topicSlug && ent.topicSlugs.has(topicSlug)) return ["FREE", "PREMIUM"];
  return ["FREE"];
}

export function tierLabel(ent: Entitlements): string {
  switch (ent.tier) {
    case "STAFF":
      return "Staff";
    case "CORPORATE":
      return "Corporate";
    case "PREMIUM":
      return ent.allAccess ? "Premium" : ent.packageNames.join(", ") || "Premium";
    case "FREE":
      return "Free";
    default:
      return "Guest";
  }
}
