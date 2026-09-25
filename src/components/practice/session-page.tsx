import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { attemptPath } from "@/lib/paths";
import { NotFoundError } from "@/server/services/courses";
import { getAttemptSession, isExamKind, modeLabel } from "@/server/services/attempts";
import { AttemptRunner, type RunnerQuestion } from "./attempt-runner";

export async function SessionPage({ id, expect }: { id: string; expect: "practice" | "exam" }) {
  const user = await requireUser(expect === "exam" ? `/mock-exams/exam/${id}` : `/question-bank/session/${id}`);
  let data;
  try {
    data = await getAttemptSession(user.id, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const { attempt, questions } = data;
  const exam = isExamKind(attempt.kind);
  if ((expect === "exam") !== exam) redirect(attemptPath(attempt.kind, attempt.id));
  if (attempt.status !== "IN_PROGRESS") redirect(attemptPath(attempt.kind, attempt.id, true));
  const assessment = attempt.assessmentId ? await db.assessment.findUnique({ where: { id: attempt.assessmentId }, select: { name: true } }) : null;
  const ids = questions.map((q) => q.questionId);
  const marks = await db.bookmark.findMany({ where: { userId: user.id, entityType: "QUESTION", entityId: { in: ids } }, select: { entityId: true, kind: true } });
  return (
    <AttemptRunner
      attemptId={attempt.id}
      title={attempt.kind === "KNOWLEDGE_CHECK" ? "Knowledge check" : modeLabel(attempt.kind, attempt.mode, assessment?.name)}
      isExam={exam}
      expiresAt={attempt.expiresAt?.toISOString() ?? null}
      questions={questions as RunnerQuestion[]}
      bookmarked={marks.filter((m) => m.kind === "SAVE").map((m) => m.entityId)}
      flagged={marks.filter((m) => m.kind === "FLAG").map((m) => m.entityId)}
    />
  );
}
