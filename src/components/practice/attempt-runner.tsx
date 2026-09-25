"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, BookmarkCheck, CheckCircle2, Clock, Flag, Loader2, Send, XCircle } from "lucide-react";
import { checkAnswerAction, saveAnswerAction, submitAttemptAction, toggleMarkAction } from "@/server/actions/attempts";
import { Button } from "@/components/ui/button";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { Alert, Progress } from "@/components/ui/feedback";
import { BookmarkButton } from "@/components/common/bookmark-button";
import { cn, formatSeconds } from "@/lib/utils";

export type Resp = { selected?: string[]; text?: string; matches?: Record<string, string> };
export type Feedback = {
  correct: boolean; explanation: string; practicalApplication: string | null; sourceReference: string | null; sourceUrl: string | null;
  modelAnswer: string | null; acceptedAnswers: string[]; correctOptionIds: string[]; correctMatches: Record<string, string>; optionExplanations: Record<string, string>;
};
export type RunnerQuestion = {
  questionId: string; order: number; type: string; stem: string; scenario: string | null; difficulty: string; topic: string;
  options: { id: string; text: string }[]; matchChoices: string[]; response: Resp | null; markedForReview: boolean; feedback: Feedback | null;
};

const TYPE_HINT: Record<string, string> = {
  SINGLE: "Choose one answer.", TRUE_FALSE: "True or false?", SCENARIO: "Read the scenario and choose one answer.",
  MULTIPLE: "Select all that apply.", INVESTIGATION: "Select all appropriate steps.", MATCHING: "Match each item to its pair.",
  FILL_BLANK: "Type the missing word or phrase.", SHORT_ANSWER: "Write a short answer.",
};

function answered(q: RunnerQuestion, r: Resp | null | undefined) {
  if (!r) return false;
  if (q.type === "MATCHING") return !!r.matches && Object.values(r.matches).some(Boolean);
  if (q.type === "FILL_BLANK" || q.type === "SHORT_ANSWER") return !!r.text?.trim();
  return !!r.selected?.length;
}

export function AttemptRunner({ attemptId, title, isExam, expiresAt, questions: initial, bookmarked, flagged }: {
  attemptId: string; title: string; isExam: boolean; expiresAt: string | null; questions: RunnerQuestion[];
  bookmarked: string[]; flagged: string[];
}) {
  const router = useRouter();
  const [qs, setQs] = useState(initial);
  const firstOpen = Math.max(0, initial.findIndex((q) => (isExam ? !answered(q, q.response) : !q.feedback)));
  const [idx, setIdx] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [confirm, setConfirm] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const [checking, startCheck] = useTransition();
  const [remaining, setRemaining] = useState<number | null>(expiresAt ? Math.max(0, (new Date(expiresAt).getTime() - Date.now()) / 1000) : null);
  const textTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const submittedRef = useRef(false);
  const q = qs[idx];

  const submit = useCallback((auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    startSubmit(async () => {
      try {
        const r = await submitAttemptAction(attemptId, auto);
        router.push(r.href);
      } catch {
        submittedRef.current = false;
        setError("Could not submit. Check your connection and try again.");
      }
    });
  }, [attemptId, router]);

  useEffect(() => {
    if (!expiresAt) return;
    const end = new Date(expiresAt).getTime();
    const t = setInterval(() => {
      const left = Math.max(0, (end - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) { clearInterval(t); submit(true); }
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt, submit]);

  const persist = useCallback(async (questionId: string, response: Resp) => {
    setSaving("saving");
    const r = await saveAnswerAction(attemptId, questionId, response).catch(() => ({ ok: false, error: "Network error — answer not saved." }));
    if (!r.ok) { setError(r.error ?? "Answer not saved."); setSaving("idle"); if (r.error?.includes("Time is up") || r.error?.includes("submitted")) router.refresh(); return; }
    setError(null);
    setSaving("saved");
  }, [attemptId, router]);

  function update(response: Resp, debounce = false) {
    if (q.feedback) return;
    setQs((prev) => prev.map((x, i) => (i === idx ? { ...x, response } : x)));
    if (!isExam) return; // practice answers are persisted when checked
    clearTimeout(textTimer.current);
    if (debounce) textTimer.current = setTimeout(() => persist(q.questionId, response), 600);
    else persist(q.questionId, response);
  }

  function toggleMark() {
    const marked = !q.markedForReview;
    setQs((prev) => prev.map((x, i) => (i === idx ? { ...x, markedForReview: marked } : x)));
    toggleMarkAction(attemptId, q.questionId, marked).catch(() => {});
  }

  function check() {
    const response = q.response ?? {};
    startCheck(async () => {
      const r = await checkAnswerAction(attemptId, q.questionId, response);
      if (!r.ok) { setError(r.error); return; }
      setError(null);
      setQs((prev) => prev.map((x, i) => (i === idx ? { ...x, feedback: r.feedback } : x)));
    });
  }

  const stats = useMemo(() => ({
    answered: qs.filter((x) => (isExam ? answered(x, x.response) : !!x.feedback)).length,
    marked: qs.filter((x) => x.markedForReview).length,
  }), [qs, isExam]);
  const lowTime = remaining !== null && remaining < 60;
  const fb = q.feedback;
  const locked = !!fb;
  const sel = new Set(q.response?.selected ?? []);
  const multi = q.type === "MULTIPLE" || q.type === "INVESTIGATION";

  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">{isExam ? "Examination" : "Practice session"}</p>
            <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
          </div>
          {remaining !== null && (
            <div role="timer" aria-live={lowTime ? "assertive" : "off"} aria-label={`Time remaining ${formatSeconds(remaining)}`}
              className={cn("flex items-center gap-2 rounded-xl border px-4 py-2 font-display text-lg font-bold tabular-nums", lowTime ? "border-danger/40 bg-danger/10 text-danger" : "border-line bg-surface")}>
              <Clock className="h-5 w-5" aria-hidden /> {formatSeconds(remaining)}
            </div>
          )}
        </div>
        <div className="mb-5 flex items-center gap-3 text-sm text-muted">
          <span>Question {idx + 1} of {qs.length}</span>
          <Progress value={(stats.answered / qs.length) * 100} className="flex-1" label="Questions answered" />
          <span>{stats.answered} {isExam ? "answered" : "checked"}</span>
        </div>

        {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

        <section className="card p-6 sm:p-8" aria-labelledby="q-stem">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone="brand">{q.topic}</Badge><LevelBadge level={q.difficulty} />
            <span className="text-xs text-muted">{TYPE_HINT[q.type]}</span>
          </div>
          {q.scenario && <div className="mb-4 rounded-xl border-l-4 border-gold-400 bg-surface-2 p-4 text-sm leading-relaxed text-ink/90"><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Scenario</p>{q.scenario}</div>}
          <h2 id="q-stem" className="text-lg font-semibold leading-snug text-ink">{q.stem}</h2>

          <div className="mt-6">
            {(q.type === "SINGLE" || q.type === "TRUE_FALSE" || q.type === "SCENARIO" || multi) && (
              <fieldset>
                <legend className="sr-only">{TYPE_HINT[q.type]}</legend>
                <div className="space-y-2.5">
                  {q.options.map((o, i) => {
                    const chosen = sel.has(o.id);
                    const isRight = fb?.correctOptionIds.includes(o.id);
                    return (
                      <label key={o.id} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition",
                        locked ? "cursor-default" : "hover:border-brand/50",
                        !fb && chosen && "border-brand bg-brand/5",
                        fb && isRight && "border-success/60 bg-success/5",
                        fb && chosen && !isRight && "border-danger/60 bg-danger/5",
                        !chosen && !(fb && isRight) && "border-line")}>
                        <input type={multi ? "checkbox" : "radio"} name={`q-${q.questionId}`} className="mt-0.5 h-4 w-4 accent-[#193B68]" checked={chosen} disabled={locked}
                          onChange={() => {
                            const next = multi ? (chosen ? [...sel].filter((x) => x !== o.id) : [...sel, o.id]) : [o.id];
                            update({ selected: next });
                          }} />
                        <span className="flex-1">
                          <span className="mr-2 font-semibold">{String.fromCharCode(65 + i)}.</span>{o.text}
                          {fb?.optionExplanations[o.id] && <span className="mt-1 block text-xs text-muted">{fb.optionExplanations[o.id]}</span>}
                        </span>
                        {fb && isRight && <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-label="Correct answer" />}
                        {fb && chosen && !isRight && <XCircle className="h-5 w-5 shrink-0 text-danger" aria-label="Your incorrect choice" />}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}
            {q.type === "MATCHING" && (
              <div className="space-y-3">
                {q.options.map((o) => {
                  const val = q.response?.matches?.[o.id] ?? "";
                  const right = fb?.correctMatches[o.id];
                  const ok = fb && right === val;
                  return (
                    <div key={o.id} className={cn("grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_1fr] sm:items-center", fb ? (ok ? "border-success/60" : "border-danger/60") : "border-line")}>
                      <label htmlFor={`m-${o.id}`} className="text-sm font-medium">{o.text}</label>
                      <div>
                        <select id={`m-${o.id}`} className="input" value={val} disabled={locked}
                          onChange={(e) => update({ matches: { ...(q.response?.matches ?? {}), [o.id]: e.target.value } })}>
                          <option value="">Select a match…</option>
                          {q.matchChoices.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {fb && !ok && <p className="mt-1 text-xs text-success">Correct: {right}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {q.type === "FILL_BLANK" && (
              <div>
                <label htmlFor="fb-input" className="label">Your answer</label>
                <input id="fb-input" className="input max-w-md" value={q.response?.text ?? ""} disabled={locked} maxLength={200} onChange={(e) => update({ text: e.target.value }, true)} />
                {fb && <p className="mt-2 text-sm">Accepted answer{fb.acceptedAnswers.length > 1 ? "s" : ""}: <strong>{fb.acceptedAnswers.join(", ")}</strong></p>}
              </div>
            )}
            {q.type === "SHORT_ANSWER" && (
              <div>
                <label htmlFor="sa-input" className="label">Your answer</label>
                <textarea id="sa-input" className="input min-h-[140px]" value={q.response?.text ?? ""} disabled={locked} maxLength={2000} onChange={(e) => update({ text: e.target.value }, true)} />
                <p className="mt-1 text-xs text-muted">Short answers are marked automatically against key concepts. Always compare with the model answer.</p>
              </div>
            )}
          </div>

          {fb && (
            <div className={cn("mt-6 rounded-xl border p-5", fb.correct ? "border-success/40 bg-success/5" : "border-danger/40 bg-danger/5")} role="status">
              <p className={cn("flex items-center gap-2 font-semibold", fb.correct ? "text-success" : "text-danger")}>
                {fb.correct ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}{fb.correct ? "Correct" : "Not quite"}
              </p>
              {fb.modelAnswer && <p className="mt-3 text-sm"><strong>Model answer:</strong> {fb.modelAnswer}</p>}
              <p className="mt-3 text-sm leading-relaxed text-ink/90"><strong>Explanation:</strong> {fb.explanation}</p>
              {fb.practicalApplication && <p className="mt-2 text-sm text-ink/85"><strong>In practice:</strong> {fb.practicalApplication}</p>}
              {fb.sourceReference && <p className="mt-2 text-xs text-muted">Source: {fb.sourceUrl ? <a href={fb.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{fb.sourceReference}</a> : fb.sourceReference}</p>}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
            {isExam ? (
              <button type="button" onClick={toggleMark} aria-pressed={q.markedForReview}
                className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium", q.markedForReview ? "border-warning/50 bg-warning/10 text-warning" : "border-line text-muted hover:text-ink")}>
                <Flag className={cn("h-4 w-4", q.markedForReview && "fill-current")} /> {q.markedForReview ? "Marked for review" : "Mark for review"}
              </button>
            ) : (
              <>
                <BookmarkButton key={`b-${q.questionId}`} entityType="QUESTION" entityId={q.questionId} initial={bookmarked.includes(q.questionId)} label="Bookmark" />
                <BookmarkButton key={`f-${q.questionId}`} entityType="QUESTION" entityId={q.questionId} kind="FLAG" initial={flagged.includes(q.questionId)} label="Flag as difficult" />
              </>
            )}
            {isExam && <span className="ml-auto text-xs text-muted" aria-live="polite">{saving === "saving" ? "Saving…" : saving === "saved" ? "Answer saved" : ""}</span>}
          </div>
        </section>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}><ArrowLeft className="h-4 w-4" /> Previous</Button>
          <div className="flex gap-2">
            {!isExam && !fb && <Button onClick={check} disabled={checking || !answered(q, q.response)}>{checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Check answer</Button>}
            {idx < qs.length - 1 ? (
              <Button variant={!isExam && !fb ? "secondary" : "primary"} onClick={() => setIdx((i) => Math.min(qs.length - 1, i + 1))}>Next <ArrowRight className="h-4 w-4" /></Button>
            ) : (
              <Button variant="gold" onClick={() => setConfirm(true)} disabled={submitting}><Send className="h-4 w-4" /> {isExam ? "Submit examination" : "Finish session"}</Button>
            )}
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="card p-5">
          <p className="text-sm font-semibold">Question navigator</p>
          <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-10 lg:grid-cols-5">
            {qs.map((x, i) => {
              const done = isExam ? answered(x, x.response) : !!x.feedback;
              return (
                <button key={x.questionId} type="button" onClick={() => setIdx(i)} aria-label={`Question ${i + 1}${done ? ", answered" : ""}${x.markedForReview ? ", marked for review" : ""}`} aria-current={i === idx ? "step" : undefined}
                  className={cn("relative grid h-9 place-items-center rounded-lg border text-xs font-semibold transition",
                    i === idx && "ring-2 ring-gold-400",
                    !isExam && x.feedback ? (x.feedback.correct ? "border-success/50 bg-success/10 text-success" : "border-danger/50 bg-danger/10 text-danger")
                      : done ? "border-brand bg-brand text-white dark:text-navy" : "border-line bg-surface text-muted hover:border-brand/40")}>
                  {i + 1}
                  {x.markedForReview && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-warning" aria-hidden />}
                </button>
              );
            })}
          </div>
          <dl className="mt-4 space-y-1 text-xs text-muted">
            <div className="flex justify-between"><dt>{isExam ? "Answered" : "Checked"}</dt><dd>{stats.answered}/{qs.length}</dd></div>
            {isExam && <div className="flex justify-between"><dt>Marked for review</dt><dd>{stats.marked}</dd></div>}
          </dl>
          <Button variant="gold" className="mt-4 w-full" onClick={() => setConfirm(true)} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {isExam ? "Submit" : "Finish"}
          </Button>
          {isExam && <p className="mt-3 text-xs text-muted">Answers save automatically. Correct answers are shown only after submission.{expiresAt ? " The exam submits automatically when time runs out." : ""}</p>}
          {!isExam && <p className="mt-3 flex items-start gap-1.5 text-xs text-muted"><BookmarkCheck className="mt-0.5 h-3.5 w-3.5" /> Your progress is saved — you can leave and resume this session later.</p>}
        </div>
      </aside>

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-h">
          <div className="card w-full max-w-md animate-fade-up p-6">
            <h2 id="confirm-h" className="flex items-center gap-2 text-lg font-bold"><AlertTriangle className="h-5 w-5 text-warning" /> {isExam ? "Submit your examination?" : "Finish this session?"}</h2>
            <p className="mt-2 text-sm text-muted">
              You have {isExam ? "answered" : "checked"} {stats.answered} of {qs.length} questions.
              {qs.length - stats.answered > 0 && ` ${qs.length - stats.answered} will be marked as incorrect.`}
              {isExam && stats.marked > 0 && ` ${stats.marked} question(s) are marked for review.`}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirm(false)} autoFocus>Keep working</Button>
              <Button variant="gold" onClick={() => submit(false)} disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
