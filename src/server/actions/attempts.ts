"use server";
import { redirect } from "next/navigation";
import { getCurrentUser, requireActionUser } from "@/lib/auth/session";
import { attemptPath } from "@/lib/paths";
import { AccessError, NotFoundError } from "@/server/services/courses";
import {
  AttemptError, checkAnswer, examConfigSchema, saveAnswer, startAssessment, startPractice, submitAttempt, toggleReviewMark, type PracticeMode,
} from "@/server/services/attempts";
import type { ActionState } from "@/server/action-types";
import { redirectOrReturn } from "@/server/action-redirect";
import { rateLimit } from "@/lib/rate-limit";

function known(e: unknown): string {
  if (e instanceof AttemptError || e instanceof AccessError || e instanceof NotFoundError) return e.message;
  throw e;
}

export async function startPracticeAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/question-bank");
  let target: string;
  try {
    const a = await startPractice(user, {
      mode: String(form.get("mode") || "STANDARD") as PracticeMode,
      topic: (form.get("topic") as string) || undefined,
      difficulty: (form.get("difficulty") as string) || undefined,
      count: form.get("count") ? Number(form.get("count")) : undefined,
      timed: form.get("timed") === "on",
    });
    target = attemptPath(a.kind, a.id);
  } catch (e) {
    return { error: known(e) };
  }
  return redirectOrReturn(target);
}

export async function startAssessmentAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mock-exams");
  const slug = String(form.get("slug") || "");
  const parsed = examConfigSchema.safeParse({
    topics: form.getAll("topics").map(String).filter(Boolean),
    difficulty: (form.get("difficulty") as string) || null,
    questionCount: form.get("questionCount") || undefined,
    timeLimitMinutes: form.get("timeLimitMinutes") ?? undefined,
  });
  if (!parsed.success) return { error: "Please check the examination settings." };
  let target: string;
  try {
    const a = await startAssessment(user, slug, parsed.data);
    target = attemptPath(a.kind, a.id);
  } catch (e) {
    return { error: known(e) };
  }
  return redirectOrReturn(target);
}

type Resp = { selected?: string[]; text?: string; matches?: Record<string, string> };

export async function saveAnswerAction(attemptId: string, questionId: string, response: Resp) {
  const user = await requireActionUser();
  if (!rateLimit(`ans:${user.id}`, 600, 60_000).ok) return { ok: false, error: "Too many requests" };
  try {
    await saveAnswer(user.id, attemptId, questionId, response);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: known(e) };
  }
}

export async function toggleMarkAction(attemptId: string, questionId: string, marked: boolean) {
  const user = await requireActionUser();
  try {
    await toggleReviewMark(user.id, attemptId, questionId, marked);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: known(e) };
  }
}

export async function checkAnswerAction(attemptId: string, questionId: string, response: Resp) {
  const user = await requireActionUser();
  try {
    return { ok: true as const, feedback: await checkAnswer(user.id, attemptId, questionId, response) };
  } catch (e) {
    return { ok: false as const, error: known(e) };
  }
}

export async function submitAttemptAction(attemptId: string, auto = false) {
  const user = await requireActionUser();
  const a = await submitAttempt(user.id, attemptId, { auto });
  return { ok: true, href: attemptPath(a.kind, a.id, true) };
}
