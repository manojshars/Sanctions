import { db } from "@/lib/db";
import { canAccessCourse, getEntitlements } from "@/lib/entitlements";
import type { Role } from "@/lib/rbac";
import { topicAccuracy } from "./attempts";
import { courseProgressFor } from "./courses";

type Actor = { id: string; role: Role; level: string; interests: string[] };

const LEVEL_ORDER = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

/** Recommendations derived only from the learner's own data: interests, level, progress and weak topics. */
export async function recommendCourses(user: Actor, take = 3) {
  const [ent, stats, enrolled] = await Promise.all([
    getEntitlements(user),
    topicAccuracy(user.id),
    db.enrollment.findMany({ where: { userId: user.id }, select: { courseId: true, status: true, course: { select: { topicId: true, level: true } } } }),
  ]);
  const weak = new Set(stats.filter((s) => s.total >= 3 && s.accuracy < 60).map((s) => s.topic));
  const interests = new Set(user.interests);
  const enrolledIds = new Set(enrolled.map((e) => e.courseId));
  const completedTopics = new Set(enrolled.filter((e) => e.status === "COMPLETED").map((e) => e.course.topicId));
  const candidates = await db.course.findMany({ where: { status: "PUBLISHED", id: { notIn: [...enrolledIds] } }, include: { topic: true, _count: { select: { modules: true } } } });
  const userLevel = LEVEL_ORDER.indexOf(user.level);
  const scored = candidates.map((c) => {
    const reasons: string[] = [];
    let score = 0;
    if (weak.has(c.topic.slug)) { score += 4; reasons.push(`Strengthen ${c.topic.shortName} — your practice accuracy is below 60%`); }
    if (interests.has(c.topic.slug)) { score += 2; reasons.push(`Matches your interest in ${c.topic.shortName}`); }
    const lvl = LEVEL_ORDER.indexOf(c.level);
    if (lvl === userLevel) { score += 1.5; reasons.push(`Suited to your ${user.level.toLowerCase()} level`); }
    else if (completedTopics.has(c.topicId) && lvl === userLevel + 1) { score += 1.5; reasons.push("Next step after a course you completed"); }
    else if (Math.abs(lvl - userLevel) > 1) score -= 1;
    const accessible = canAccessCourse(ent, { id: c.id, accessTier: c.accessTier, topicSlug: c.topic.slug });
    if (accessible) score += 1;
    return { course: c, score, reasons, accessible };
  });
  return scored.filter((s) => s.score > 0 && s.reasons.length).sort((a, b) => b.score - a.score || a.course.title.localeCompare(b.course.title)).slice(0, take);
}

export async function dashboardData(user: Actor) {
  const [enrollments, attempts, stats, certificates, savedVideos, bookmarkedQuestions, notifications, lessonDone] = await Promise.all([
    db.enrollment.findMany({ where: { userId: user.id }, include: { course: { include: { topic: true, _count: { select: { modules: true } } } } }, orderBy: { updatedAt: "desc" } }),
    db.attempt.findMany({ where: { userId: user.id }, orderBy: { startedAt: "desc" }, take: 30, include: { assessment: { select: { name: true } } } }),
    topicAccuracy(user.id),
    db.certificate.findMany({ where: { userId: user.id }, orderBy: { issuedAt: "desc" } }),
    db.bookmark.findMany({ where: { userId: user.id, entityType: "VIDEO" }, take: 5 }),
    db.bookmark.count({ where: { userId: user.id, entityType: "QUESTION" } }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.lessonProgress.findMany({ where: { userId: user.id, status: "COMPLETED" }, orderBy: { completedAt: "desc" }, take: 10, include: { lesson: { include: { module: { include: { course: { select: { title: true, slug: true } } } } } } } }),
  ]);
  const progress = await courseProgressFor(user.id, enrollments.map((e) => e.courseId));
  // Resume point: the last viewed lesson if unfinished, otherwise the first incomplete lesson in course order.
  const courseLessons = await db.lesson.findMany({
    where: { module: { courseId: { in: enrollments.map((e) => e.courseId) } } },
    select: { id: true, slug: true, title: true, order: true, module: { select: { courseId: true, order: true } } },
  });
  const doneIds = new Set((await db.lessonProgress.findMany({ where: { userId: user.id, status: "COMPLETED" }, select: { lessonId: true } })).map((p) => p.lessonId));
  const resumeFor = (courseId: string, lastLessonId: string | null) => {
    const ordered = courseLessons.filter((l) => l.module.courseId === courseId).sort((a, b) => a.module.order - b.module.order || a.order - b.order);
    const last = ordered.find((l) => l.id === lastLessonId);
    if (last && !doneIds.has(last.id)) return last;
    return ordered.find((l) => !doneIds.has(l.id)) ?? last ?? null;
  };
  const videos = await db.videoResource.findMany({ where: { id: { in: savedVideos.map((v) => v.entityId) } } });
  const answered = stats.reduce((s, x) => s + x.total, 0);
  const correct = stats.reduce((s, x) => s + x.correct, 0);

  const activity = [
    ...attempts.filter((a) => a.submittedAt).map((a) => ({ at: a.submittedAt!, text: `Completed ${a.assessment?.name ?? (a.kind === "DAILY_CHALLENGE" ? "the Daily Challenge" : a.kind === "KNOWLEDGE_CHECK" ? "a knowledge check" : "a practice session")} — ${a.score}%`, href: undefined as string | undefined })),
    ...lessonDone.filter((l) => l.completedAt).map((l) => ({ at: l.completedAt!, text: `Completed lesson “${l.lesson.title}” in ${l.lesson.module.course.title}`, href: `/academy/courses/${l.lesson.module.course.slug}/lessons/${l.lesson.slug}` })),
    ...certificates.map((c) => ({ at: c.issuedAt, text: `Earned a certificate for ${c.courseTitle}`, href: `/certificates/${c.id}` })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 8);

  return {
    enrollments: enrollments.map((e) => ({ ...e, progress: progress[e.courseId], lastLesson: resumeFor(e.courseId, e.lastLessonId) })),
    attempts, stats, certificates, videos, bookmarkedQuestions, notifications, activity,
    answered, accuracy: answered ? Math.round((correct / answered) * 100) : null,
    exams: attempts.filter((a) => a.kind === "MOCK_EXAM" || a.kind === "READINESS").slice(0, 4),
  };
}
