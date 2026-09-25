import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { canAccessCourse, getEntitlements, type Entitlements } from "@/lib/entitlements";
import type { Role } from "@/lib/rbac";
import { completeCourseIfEligible } from "./certificates";

export class AccessError extends Error {
  constructor(message = "This content requires a Premium membership or a relevant learning package.") {
    super(message);
    this.name = "AccessError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export interface CourseFilters {
  q?: string;
  topic?: string;
  level?: string;
  access?: string; // FREE | PREMIUM
  duration?: string; // short | medium | long
  certificate?: string; // yes
  format?: string;
  page?: number;
  pageSize?: number;
}

export function buildCourseWhere(f: CourseFilters): Prisma.CourseWhereInput {
  const where: Prisma.CourseWhereInput = { status: "PUBLISHED" };
  const and: Prisma.CourseWhereInput[] = [];
  if (f.q) {
    const q = f.q.trim();
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { subtitle: { contains: q, mode: "insensitive" } },
        { overview: { contains: q, mode: "insensitive" } },
        { keywords: { has: q.toLowerCase() } },
      ],
    });
  }
  if (f.topic) and.push({ topic: { slug: f.topic } });
  if (f.level && ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(f.level)) and.push({ level: f.level as never });
  if (f.access === "FREE" || f.access === "PREMIUM") and.push({ accessTier: f.access });
  if (f.duration === "short") and.push({ durationMinutes: { lte: 90 } });
  if (f.duration === "medium") and.push({ durationMinutes: { gt: 90, lte: 130 } });
  if (f.duration === "long") and.push({ durationMinutes: { gt: 130 } });
  if (f.certificate === "yes") and.push({ hasCertificate: true });
  if (f.format && ["SELF_PACED", "VIDEO", "READING", "BLENDED"].includes(f.format)) and.push({ format: f.format as never });
  if (and.length) where.AND = and;
  return where;
}

export async function listCourses(f: CourseFilters) {
  const pageSize = Math.min(Math.max(f.pageSize ?? 12, 1), 48);
  const page = Math.max(f.page ?? 1, 1);
  const where = buildCourseWhere(f);
  const [total, items] = await Promise.all([
    db.course.count({ where }),
    db.course.findMany({
      where,
      include: { topic: true, _count: { select: { modules: true } } },
      orderBy: [{ level: "asc" }, { title: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { total, items, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getCourseDetail(slug: string) {
  return db.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      topic: true,
      objectives: { orderBy: { order: "asc" } },
      modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" }, select: { id: true, slug: true, title: true, type: true, durationMinutes: true } } } },
      resources: { select: { id: true, title: true, description: true, filename: true, accessTier: true } },
      related: { where: { status: "PUBLISHED" }, include: { topic: true }, take: 3 },
      assessments: { where: { type: "FINAL" }, select: { id: true, questionCount: true, passingScore: true, timeLimitMinutes: true } },
      reviews: { where: { status: "PUBLISHED" }, include: { user: { select: { name: true } } }, take: 5, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function courseAccess(user: { id: string; role: Role } | null, course: { id: string; accessTier: "FREE" | "PREMIUM"; topic: { slug: string } }, ent?: Entitlements) {
  const e = ent ?? (await getEntitlements(user));
  return canAccessCourse(e, { id: course.id, accessTier: course.accessTier, topicSlug: course.topic.slug });
}

export async function enroll(user: { id: string; role: Role }, courseId: string) {
  const course = await db.course.findFirst({ where: { id: courseId, status: "PUBLISHED" }, include: { topic: true } });
  if (!course) throw new NotFoundError("Course not found");
  if (!(await courseAccess(user, course))) throw new AccessError();
  const assigned = await db.corporateAssignment.findFirst({ where: { userId: user.id, courseId } });
  return db.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    update: {},
    create: { userId: user.id, courseId, source: assigned ? "CORPORATE" : "SELF" },
  });
}

export async function getEnrollment(userId: string, courseId: string) {
  return db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
}

/** Loads a lesson for an enrolled learner; throws if not enrolled or lacking access. */
export async function getLessonForLearner(user: { id: string; role: Role }, courseSlug: string, lessonSlug: string) {
  const course = await db.course.findFirst({
    where: { slug: courseSlug, status: "PUBLISHED" },
    include: {
      topic: true,
      modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" }, select: { id: true, slug: true, title: true, durationMinutes: true, type: true } } } },
    },
  });
  if (!course) throw new NotFoundError("Course not found");
  if (!(await courseAccess(user, course))) throw new AccessError();
  const enrollment = await getEnrollment(user.id, course.id);
  if (!enrollment) throw new AccessError("Enrol in this course to access its lessons.");
  const flat = course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title, moduleId: m.id })));
  const idx = flat.findIndex((l) => l.slug === lessonSlug);
  if (idx === -1) throw new NotFoundError("Lesson not found");
  const lesson = await db.lesson.findUniqueOrThrow({
    where: { id: flat[idx].id },
    include: { video: true, questions: { where: { status: "PUBLISHED" }, select: { id: true }, take: 5 } },
  });
  const progress = await db.lessonProgress.findMany({ where: { userId: user.id, lesson: { module: { courseId: course.id } } } });
  return { course, lesson, flat, index: idx, prev: flat[idx - 1] ?? null, next: flat[idx + 1] ?? null, progress, enrollment };
}

async function assertEnrolledForLesson(userId: string, lessonId: string) {
  const lesson = await db.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
  if (!lesson) throw new NotFoundError("Lesson not found");
  const enrollment = await getEnrollment(userId, lesson.module.courseId);
  if (!enrollment) throw new AccessError("You are not enrolled in this course.");
  return { lesson, courseId: lesson.module.courseId };
}

/** Saves partial progress (e.g. scroll position). Never downgrades a completed lesson. */
export async function saveLessonProgress(userId: string, lessonId: string, percent: number) {
  const { courseId } = await assertEnrolledForLesson(userId, lessonId);
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const existing = await db.lessonProgress.findUnique({ where: { userId_lessonId: { userId, lessonId } } });
  const record = existing
    ? await db.lessonProgress.update({
        where: { id: existing.id },
        data: { lastViewedAt: new Date(), progressPercent: existing.status === "COMPLETED" ? 100 : Math.max(existing.progressPercent, pct) },
      })
    : await db.lessonProgress.create({ data: { userId, lessonId, progressPercent: pct } });
  await db.enrollment.update({ where: { userId_courseId: { userId, courseId } }, data: { lastLessonId: lessonId } });
  return record;
}

export async function completeLesson(userId: string, lessonId: string) {
  const { courseId } = await assertEnrolledForLesson(userId, lessonId);
  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { status: "COMPLETED", progressPercent: 100, completedAt: new Date(), lastViewedAt: new Date() },
    create: { userId, lessonId, status: "COMPLETED", progressPercent: 100, completedAt: new Date() },
  });
  await db.enrollment.update({ where: { userId_courseId: { userId, courseId } }, data: { lastLessonId: lessonId } });
  return completeCourseIfEligible(userId, courseId);
}

export async function courseProgressFor(userId: string, courseIds: string[]) {
  if (!courseIds.length) return {} as Record<string, { done: number; total: number; pct: number }>;
  const [totals, done] = await Promise.all([
    db.lesson.groupBy({ by: ["moduleId"], where: { module: { courseId: { in: courseIds } } }, _count: true }),
    db.lessonProgress.findMany({ where: { userId, status: "COMPLETED", lesson: { module: { courseId: { in: courseIds } } } }, select: { lesson: { select: { module: { select: { courseId: true } } } } } }),
  ]);
  const modules = await db.module.findMany({ where: { courseId: { in: courseIds } }, select: { id: true, courseId: true } });
  const modCourse = Object.fromEntries(modules.map((m) => [m.id, m.courseId]));
  const out: Record<string, { done: number; total: number; pct: number }> = {};
  for (const id of courseIds) out[id] = { done: 0, total: 0, pct: 0 };
  for (const t of totals) out[modCourse[t.moduleId]].total += t._count;
  for (const d of done) out[d.lesson.module.courseId].done++;
  for (const id of courseIds) out[id].pct = out[id].total ? Math.round((out[id].done / out[id].total) * 100) : 0;
  return out;
}
