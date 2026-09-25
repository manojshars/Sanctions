"use client";
import { useActionRedirect } from "@/components/forms/use-action";
import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, ClipboardList, NotebookPen } from "lucide-react";
import { completeLessonAction, saveProgressAction, startKnowledgeCheckAction } from "@/server/actions/learning";
import { SubmitButton } from "@/components/forms/submit-button";
import { Alert } from "@/components/ui/feedback";
import type { ActionState } from "@/server/action-types";

/** Persists reading progress (max scroll depth) to the server, debounced. */
export function ProgressTracker({ lessonId, initial }: { lessonId: string; initial: number }) {
  const maxRef = useRef(initial);
  const sentRef = useRef(initial);
  useEffect(() => {
    saveProgressAction(lessonId, Math.max(initial, 5)).catch(() => {});
    let t: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      const el = document.getElementById("lesson-body");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const seen = Math.min(100, Math.max(0, ((window.innerHeight - r.top) / r.height) * 100));
      maxRef.current = Math.max(maxRef.current, Math.round(seen));
      clearTimeout(t);
      t = setTimeout(() => {
        if (maxRef.current - sentRef.current >= 10) {
          sentRef.current = maxRef.current;
          saveProgressAction(lessonId, maxRef.current).catch(() => {});
        }
      }, 800);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(t); };
  }, [lessonId, initial]);
  return null;
}

export function CompleteLessonButton({ lessonId, nextHref, completed }: { lessonId: string; nextHref: string | null; completed: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(completeLessonAction.bind(null, lessonId, nextHref), {});
  useActionRedirect(state);
  if (completed && !nextHref) return <p className="inline-flex items-center gap-2 text-sm font-medium text-success"><CheckCircle2 className="h-4 w-4" /> Lesson completed</p>;
  return (
    <form action={action} className="space-y-2">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}
      <SubmitButton variant="gold" size="lg" pendingText="Saving…">
        <CheckCircle2 className="h-4 w-4" />{completed ? "Next lesson" : nextHref ? "Mark complete & continue" : "Mark as complete"}
      </SubmitButton>
    </form>
  );
}

export function KnowledgeCheckButton({ courseId }: { courseId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(startKnowledgeCheckAction.bind(null, courseId), {});
  useActionRedirect(state);
  return (
    <form action={action}>
      {state.error && <Alert tone="danger" className="mb-2">{state.error}</Alert>}
      <SubmitButton variant="secondary" pendingText="Preparing…"><ClipboardList className="h-4 w-4" /> Take a 3-question knowledge check</SubmitButton>
    </form>
  );
}

/** Private exercise notes kept in this browser only (clearly labelled). */
export function ExerciseNotes({ lessonId }: { lessonId: string }) {
  const key = `fca-notes-${lessonId}`;
  const [v, setV] = useState("");
  useEffect(() => { try { setV(localStorage.getItem(key) ?? ""); } catch {} }, [key]);
  return (
    <div className="mt-4">
      <label htmlFor="ex-notes" className="label flex items-center gap-2"><NotebookPen className="h-4 w-4 text-accent" /> Your working notes</label>
      <textarea id="ex-notes" className="input min-h-[120px]" value={v} onChange={(e) => { setV(e.target.value); try { localStorage.setItem(key, e.target.value); } catch {} }} placeholder="Draft your answer here…" />
      <p className="mt-1 text-xs text-muted">Notes are saved in this browser only and are not submitted.</p>
    </div>
  );
}
