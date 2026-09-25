"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActionUser, getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AccessError, completeLesson, enroll, NotFoundError, saveLessonProgress } from "@/server/services/courses";
import { AttemptError, startFinalAssessment, startKnowledgeCheck } from "@/server/services/attempts";
import type { ActionState } from "@/server/action-types";
import { attemptPath } from "@/lib/paths";

function toError(e: unknown): ActionState {
  if (e instanceof AccessError || e instanceof NotFoundError || e instanceof AttemptError) return { error: e.message };
  throw e;
}

export async function enrollAction(courseId: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    const c = await db.course.findUnique({ where: { id: courseId }, select: { slug: true } });
    redirect(`/login?next=/academy/courses/${c?.slug ?? ""}`);
  }
  let firstLesson: string | null = null;
  let slug = "";
  try {
    await enroll(user, courseId);
    const course = await db.course.findUniqueOrThrow({ where: { id: courseId }, include: { modules: { orderBy: { order: "asc" }, take: 1, include: { lessons: { orderBy: { order: "asc" }, take: 1 } } } } });
    slug = course.slug;
    firstLesson = course.modules[0]?.lessons[0]?.slug ?? null;
  } catch (e) {
    return toError(e);
  }
  revalidatePath(`/academy/courses/${slug}`);
  redirect(firstLesson ? `/academy/courses/${slug}/lessons/${firstLesson}` : `/academy/courses/${slug}`);
}

export async function saveProgressAction(lessonId: string, percent: number): Promise<ActionState> {
  const user = await requireActionUser();
  try {
    await saveLessonProgress(user.id, lessonId, percent);
    return { ok: true };
  } catch (e) {
    return toError(e);
  }
}

export async function completeLessonAction(lessonId: string, nextHref: string | null): Promise<ActionState> {
  const user = await requireActionUser();
  let certificateId: string | null = null;
  try {
    const res = await completeLesson(user.id, lessonId);
    certificateId = res.certificate?.id ?? null;
  } catch (e) {
    return toError(e);
  }
  revalidatePath("/dashboard");
  if (certificateId) redirect(`/certificates/${certificateId}?new=1`);
  if (nextHref && nextHref.startsWith("/academy/")) redirect(nextHref);
  return { ok: true, message: "Lesson completed." };
}

export async function startFinalAssessmentAction(courseId: string): Promise<ActionState> {
  const user = await requireActionUser();
  let id: string;
  try {
    id = (await startFinalAssessment(user, courseId)).id;
  } catch (e) {
    return toError(e);
  }
  redirect(attemptPath("FINAL", id));
}

export async function startKnowledgeCheckAction(courseId: string): Promise<ActionState> {
  const user = await requireActionUser();
  let id: string;
  try {
    id = (await startKnowledgeCheck(user, courseId)).id;
  } catch (e) {
    return toError(e);
  }
  redirect(attemptPath("KNOWLEDGE_CHECK", id));
}
