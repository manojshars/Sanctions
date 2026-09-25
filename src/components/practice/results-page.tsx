import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Award, BookOpen, CheckCircle2, Clock, Layers, RotateCcw, TrendingDown, TrendingUp, XCircle } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { attemptPath } from "@/lib/paths";
import { NotFoundError } from "@/server/services/courses";
import { getAttemptResults, isExamKind, modeLabel, readinessInsights } from "@/server/services/attempts";
import { Alert, Progress, Ring } from "@/components/ui/feedback";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { AssessmentStart, QuickStart } from "./start-forms";
import { BookmarkButton } from "@/components/common/bookmark-button";
import { cn, formatSeconds } from "@/lib/utils";
import type { QuestionResponse } from "@/lib/scoring";

function YourAnswer({ type, response, options }: { type: string; response: QuestionResponse | null; options: { id: string; text: string; matchText: string | null }[] }) {
  if (!response) return <span className="italic text-muted">No answer</span>;
  if (type === "FILL_BLANK" || type === "SHORT_ANSWER") return <span>{response.text || <em className="text-muted">No answer</em>}</span>;
  if (type === "MATCHING") return <ul className="list-disc pl-5">{options.map((o) => <li key={o.id}>{o.text} → {response.matches?.[o.id] || <em className="text-muted">none</em>}</li>)}</ul>;
  const chosen = options.filter((o) => response.selected?.includes(o.id));
  return <span>{chosen.length ? chosen.map((o) => o.text).join("; ") : <em className="text-muted">No answer</em>}</span>;
}

export async function ResultsPage({ id, expect }: { id: string; expect: "practice" | "exam" }) {
  const user = await requireUser();
  let res;
  try {
    res = await getAttemptResults(user.id, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  if (!res) {
    const a = await db.attempt.findUniqueOrThrow({ where: { id } });
    redirect(attemptPath(a.kind, a.id));
  }
  const { attempt } = res;
  if ((expect === "exam") !== isExamKind(attempt.kind)) redirect(attemptPath(attempt.kind, attempt.id, true));
  const insights = attempt.kind === "READINESS" ? await readinessInsights(user.id, id) : null;
  const topics = await db.topic.findMany();
  const tname = (slug: string) => topics.find((t) => t.slug === slug)?.name ?? slug;
  const course = attempt.courseId ? await db.course.findUnique({ where: { id: attempt.courseId }, select: { slug: true, title: true } }) : null;
  const certificate = attempt.kind === "FINAL" && attempt.courseId ? await db.certificate.findUnique({ where: { userId_courseId: { userId: user.id, courseId: attempt.courseId } } }) : null;
  const marks = await db.bookmark.findMany({ where: { userId: user.id, entityType: "QUESTION", entityId: { in: res.items.map((i) => i.question.id) } } });
  const wrong = res.items.filter((i) => !i.correct).length;
  const title = attempt.kind === "KNOWLEDGE_CHECK" ? "Knowledge check" : modeLabel(attempt.kind, attempt.mode, attempt.assessment?.name);
  const delta = res.previousScore != null && attempt.score != null ? attempt.score - res.previousScore : null;
  const config = (attempt.config ?? {}) as { topic?: string | null; difficulty?: string | null; mode?: string; requested?: number; available?: number };

  return (
    <div className="container py-10">
      <p className="eyebrow">{isExamKind(attempt.kind) ? "Examination results" : "Quiz results"}</p>
      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h1>
      {attempt.status === "AUTO_SUBMITTED" && <Alert tone="warning" className="mt-4">Time ran out — this session was submitted automatically with the answers saved at that point.</Alert>}
      {config.requested && config.available !== undefined && config.available < config.requested && (
        <Alert tone="info" className="mt-4">This format requested {config.requested} questions; {attempt.totalCount} were available in the published question bank for your access level.</Alert>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="card flex flex-col items-center p-6 text-center">
          <Ring value={attempt.score ?? 0} size={132} stroke={10} label="Score" />
          <p className="mt-4 text-lg font-semibold">{attempt.correctCount} of {attempt.totalCount} correct</p>
          {attempt.passed != null && (
            <Badge tone={attempt.passed ? "success" : "danger"} className="mt-2">{attempt.passed ? "Pass" : "Below pass mark"}{attempt.assessment ? ` · ${attempt.assessment.passingScore}% required` : ""}</Badge>
          )}
          <dl className="mt-5 grid w-full grid-cols-2 gap-3 text-left text-sm">
            <div className="rounded-lg bg-surface-2 p-3"><dt className="text-xs text-muted">Time taken</dt><dd className="font-semibold"><Clock className="mr-1 inline h-3.5 w-3.5" />{formatSeconds(attempt.durationSeconds ?? 0)}</dd></div>
            <div className="rounded-lg bg-surface-2 p-3"><dt className="text-xs text-muted">Attempted</dt><dd className="font-semibold">{res.items.filter((i) => i.response).length}/{attempt.totalCount}</dd></div>
            {delta != null && (
              <div className="col-span-2 rounded-lg bg-surface-2 p-3"><dt className="text-xs text-muted">Change vs previous attempt</dt>
                <dd className={cn("font-semibold", delta >= 0 ? "text-success" : "text-danger")}>{delta >= 0 ? <TrendingUp className="mr-1 inline h-4 w-4" /> : <TrendingDown className="mr-1 inline h-4 w-4" />}{delta > 0 ? "+" : ""}{delta} points</dd></div>
            )}
          </dl>
          {certificate && <ButtonLink href={`/certificates/${certificate.id}`} variant="gold" className="mt-5 w-full"><Award className="h-4 w-4" /> View your certificate</ButtonLink>}
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">Topic-wise accuracy</h2>
          <ul className="mt-4 space-y-3">
            {res.breakdown.map((b) => (
              <li key={b.topic}>
                <div className="mb-1 flex justify-between text-sm"><span>{tname(b.topic)}</span><span className="text-muted">{b.correct}/{b.total} · {b.accuracy}%</span></div>
                <Progress value={b.accuracy} tone={b.accuracy >= 75 ? "success" : b.accuracy >= 60 ? "brand" : "gold"} label={`${tname(b.topic)} accuracy`} />
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
            {wrong > 0 && <QuickStart fields={{ mode: "INCORRECT_REVIEW" }} label={<><RotateCcw className="h-4 w-4" /> Retry missed questions</>} />}
            {attempt.assessment && attempt.kind !== "FINAL" && <AssessmentStart slug={attempt.assessment.slug} label={<><RotateCcw className="h-4 w-4" /> Retake with a new question set</>} variant="secondary" />}
            {!attempt.assessment && attempt.kind === "PRACTICE" && <QuickStart fields={{ mode: config.mode ?? "STANDARD", topic: config.topic ?? undefined, difficulty: config.difficulty ?? undefined }} label="New session, same settings" variant="secondary" />}
            {course && <ButtonLink href={`/academy/courses/${course.slug}`} variant="secondary"><BookOpen className="h-4 w-4" /> Back to {course.title}</ButtonLink>}
            <ButtonLink href={isExamKind(attempt.kind) ? "/mock-exams" : "/question-bank"} variant="ghost">{isExamKind(attempt.kind) ? "Mock Exam Center" : "Question Bank"} <ArrowRight className="h-4 w-4" /></ButtonLink>
          </div>
        </div>
      </div>

      {insights && (
        <section className="mt-8 space-y-5">
          <Alert tone="info" title="About your readiness score">This readiness score is an educational indicator based on your answers to our practice questions. It does not predict or guarantee success in any external certification examination.</Alert>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="card p-6"><h2 className="font-semibold text-success">Strengths</h2>
              {insights.strengths.length ? <ul className="mt-3 space-y-1.5 text-sm">{insights.strengths.map((s) => <li key={s.topic} className="flex justify-between"><span>{s.name}</span><span className="text-muted">{s.accuracy}%</span></li>)}</ul> : <p className="mt-2 text-sm text-muted">No topic reached 75% yet — keep practising.</p>}
            </div>
            <div className="card p-6"><h2 className="font-semibold text-danger">Areas requiring revision</h2>
              {insights.weak.length ? <ul className="mt-3 space-y-1.5 text-sm">{insights.weak.map((s) => <li key={s.topic} className="flex justify-between"><span>{s.name}</span><span className="text-muted">{s.accuracy}%</span></li>)}</ul> : <p className="mt-2 text-sm text-muted">No topic below 60%. Well done.</p>}
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="card p-6 lg:col-span-1"><h2 className="font-semibold">Recommended next practice</h2>
              <p className="mt-2 text-sm text-muted">{insights.nextTopic ? `A focused session on ${tname(insights.nextTopic)}.` : "A mixed standard session to consolidate."}</p>
              <QuickStart className="mt-4" fields={{ mode: insights.nextTopic ? "TOPIC_MASTERY" : "STANDARD", topic: insights.nextTopic ?? undefined }} label="Start recommended session" />
            </div>
            <div className="card p-6"><h2 className="font-semibold">Suggested courses</h2>
              {insights.courses.length ? <ul className="mt-3 space-y-2 text-sm">{insights.courses.map((c) => <li key={c.id}><Link href={`/academy/courses/${c.slug}`} className="flex items-center justify-between gap-2 hover:text-brand"><span>{c.title}</span><LevelBadge level={c.level} /></Link></li>)}</ul> : <p className="mt-2 text-sm text-muted">Browse the <Link className="text-brand underline" href="/academy/courses">catalog</Link>.</p>}
            </div>
            <div className="card p-6"><h2 className="font-semibold">Related flashcards</h2>
              {insights.decks.length ? <ul className="mt-3 space-y-2 text-sm">{insights.decks.map((d) => <li key={d.id}><Link href={`/flashcards/${d.slug}`} className="flex items-center gap-2 hover:text-brand"><Layers className="h-4 w-4 text-accent" />{d.title}</Link></li>)}</ul> : <p className="mt-2 text-sm text-muted">See the <Link className="text-brand underline" href="/flashcards">flashcard library</Link>.</p>}
            </div>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold">Answer review</h2>
        <p className="text-sm text-muted">{wrong} incorrect · {res.items.length - wrong} correct</p>
        <ol className="mt-4 space-y-3">
          {res.items.map((it, i) => {
            const q = it.question;
            const correctText = q.type === "MATCHING" ? q.options.map((o) => `${o.text} → ${o.matchText}`).join("; ")
              : q.type === "FILL_BLANK" ? q.acceptedAnswers.join(", ") : q.type === "SHORT_ANSWER" ? q.modelAnswer ?? "" : q.options.filter((o) => o.isCorrect).map((o) => o.text).join("; ");
            return (
              <li key={q.id}>
                <details className="card group p-0" open={!it.correct && i < 5}>
                  <summary className="flex cursor-pointer list-none items-start gap-3 p-5">
                    {it.correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-label="Correct" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-label="Incorrect" />}
                    <span className="flex-1"><span className="text-xs text-muted">Q{i + 1} · {q.topic.name}</span><span className="block font-medium">{q.stem}</span></span>
                  </summary>
                  <div className="space-y-3 border-t border-line px-5 pb-5 pt-4 text-sm">
                    {q.scenario && <p className="rounded-lg bg-surface-2 p-3 text-ink/85">{q.scenario}</p>}
                    <p><strong>Your answer:</strong> <YourAnswer type={q.type} response={it.response} options={q.options} /></p>
                    <p><strong>{q.type === "SHORT_ANSWER" ? "Model answer" : "Correct answer"}:</strong> {correctText}</p>
                    {Object.keys(it.feedback.optionExplanations).length > 0 && (
                      <ul className="space-y-1 text-muted">{q.options.filter((o) => o.explanation).map((o) => <li key={o.id}><em>{o.text}:</em> {o.explanation}</li>)}</ul>
                    )}
                    <p className="text-ink/90"><strong>Explanation:</strong> {q.explanation}</p>
                    {q.practicalApplication && <p className="text-ink/85"><strong>In practice:</strong> {q.practicalApplication}</p>}
                    {q.sourceReference && <p className="text-xs text-muted">Source: {q.sourceUrl ? <a className="underline" href={q.sourceUrl} target="_blank" rel="noopener noreferrer">{q.sourceReference}</a> : q.sourceReference}</p>}
                    <div className="flex gap-2 pt-1">
                      <BookmarkButton entityType="QUESTION" entityId={q.id} initial={marks.some((m) => m.entityId === q.id && m.kind === "SAVE")} label="Bookmark" />
                      <BookmarkButton entityType="QUESTION" entityId={q.id} kind="FLAG" initial={marks.some((m) => m.entityId === q.id && m.kind === "FLAG")} label="Flag as difficult" />
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
