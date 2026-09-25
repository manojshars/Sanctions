"use client";
import { useState, useTransition } from "react";
import { CalendarPlus, CheckCircle2, Save } from "lucide-react";
import { updateVideoProgressAction } from "@/server/actions/videos";
import { cn } from "@/lib/utils";

export function VideoControls({ videoId, watched: w0, inPlan: p0, notes: n0 }: { videoId: string; watched: boolean; inPlan: boolean; notes: string }) {
  const [watched, setWatched] = useState(w0);
  const [inPlan, setInPlan] = useState(p0);
  const [notes, setNotes] = useState(n0);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (input: Parameters<typeof updateVideoProgressAction>[1], done: string) =>
    start(async () => { const r = await updateVideoProgressAction(videoId, input); setMsg(r.ok ? done : r.error ?? "Error"); });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} aria-pressed={watched} onClick={() => { setWatched(!watched); run({ watched: !watched }, !watched ? "Marked as watched." : "Marked as not watched."); }}
          className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium", watched ? "border-success/50 bg-success/10 text-success" : "border-line text-muted hover:text-ink")}>
          <CheckCircle2 className="h-4 w-4" /> {watched ? "Watched" : "Mark as watched"}
        </button>
        <button type="button" disabled={pending} aria-pressed={inPlan} onClick={() => { setInPlan(!inPlan); run({ inPlan: !inPlan }, !inPlan ? "Added to your learning plan." : "Removed from your learning plan."); }}
          className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium", inPlan ? "border-gold-400/50 bg-gold-400/10 text-accent" : "border-line text-muted hover:text-ink")}>
          <CalendarPlus className="h-4 w-4" /> {inPlan ? "In learning plan" : "Add to learning plan"}
        </button>
      </div>
      <div>
        <label htmlFor="vnotes" className="label">Learning notes</label>
        <textarea id="vnotes" className="input min-h-[120px]" maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Key takeaways…" />
        <button type="button" disabled={pending} onClick={() => run({ notes }, "Notes saved.")} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-medium text-white dark:bg-gold-400 dark:text-navy"><Save className="h-4 w-4" /> Save notes</button>
      </div>
      <p className="text-sm text-muted" aria-live="polite">{msg}</p>
    </div>
  );
}
