"use client";
import { useState } from "react";
import { startPracticeAction } from "@/server/actions/attempts";
import { useFormAction } from "@/components/forms/use-action";
import { SubmitButton } from "@/components/forms/submit-button";
import { Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "QUICK", label: "Quick", sub: "5 questions" },
  { id: "STANDARD", label: "Standard", sub: "10 questions" },
  { id: "DEEP", label: "Deep", sub: "25 questions" },
  { id: "TOPIC_MASTERY", label: "Topic Mastery", sub: "Focus on weaker areas" },
  { id: "INCORRECT_REVIEW", label: "Incorrect Review", sub: "Retry missed questions" },
  { id: "BOOKMARKED", label: "Bookmarked", sub: "Saved & flagged" },
];

export function PracticeBuilder({ topics, defaultTopic, defaultMode, signedIn }: { topics: { slug: string; name: string; count: number }[]; defaultTopic?: string; defaultMode?: string; signedIn: boolean }) {
  const [state, action] = useFormAction(startPracticeAction);
  const [mode, setMode] = useState(MODES.some((m) => m.id === defaultMode) ? defaultMode! : "STANDARD");
  const topicIrrelevant = mode === "INCORRECT_REVIEW" || mode === "BOOKMARKED";
  return (
    <form action={action} className="card p-6">
      <h2 className="text-lg font-bold">Build a practice session</h2>
      <fieldset className="mt-5">
        <legend className="label">Practice mode</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MODES.map((m) => (
            <label key={m.id} className={cn("cursor-pointer rounded-xl border p-3 text-sm transition", mode === m.id ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-line hover:border-brand/40")}>
              <input type="radio" name="mode" value={m.id} checked={mode === m.id} onChange={() => setMode(m.id)} className="sr-only" />
              <span className="block font-semibold">{m.label}</span><span className="text-xs text-muted">{m.sub}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className={cn("mt-5 grid gap-4 sm:grid-cols-3", topicIrrelevant && "opacity-50")}>
        <div className="sm:col-span-1"><label htmlFor="topic" className="label">Topic</label>
          <Select id="topic" name="topic" defaultValue={defaultTopic ?? ""} disabled={topicIrrelevant}>
            <option value="">{mode === "TOPIC_MASTERY" ? "My weakest topics" : "All topics"}</option>
            {topics.map((t) => <option key={t.slug} value={t.slug}>{t.name} ({t.count})</option>)}
          </Select></div>
        <div><label htmlFor="difficulty" className="label">Difficulty</label>
          <Select id="difficulty" name="difficulty" defaultValue="" disabled={topicIrrelevant}><option value="">Any</option><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></Select></div>
        <div><label htmlFor="count" className="label">Number of questions</label>
          <Select id="count" name="count" defaultValue=""><option value="">Mode default</option>{[5, 10, 15, 20, 25, 40].map((n) => <option key={n} value={n}>{n}</option>)}</Select></div>
      </div>
      <label className="mt-5 flex items-center gap-2 text-sm"><input type="checkbox" name="timed" className="h-4 w-4 accent-[#193B68]" /> Timed mode (75 seconds per question)</label>
      {state.error && <Alert tone="warning" className="mt-4">{state.error}</Alert>}
      <div className="mt-6 flex items-center gap-3">
        <SubmitButton size="lg" pendingText="Preparing questions…">Start practice</SubmitButton>
        {!signedIn && <p className="text-sm text-muted">You&apos;ll be asked to sign in first.</p>}
      </div>
    </form>
  );
}
