"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input, Select, Textarea } from "@/components/ui/form";

type Opt = { text: string; isCorrect: boolean; matchText: string | null; explanation: string | null };
export type QFormData = {
  topicId: string; type: string; difficulty: string; stem: string; scenario: string | null; explanation: string; practicalApplication: string | null;
  sourceReference: string | null; sourceUrl: string | null; tags: string[]; accessTier: string; courseId: string | null; options: Opt[];
  acceptedAnswers: string[]; keywords: string[]; modelAnswer: string | null;
};

const TYPES = ["SINGLE", "MULTIPLE", "TRUE_FALSE", "SCENARIO", "MATCHING", "FILL_BLANK", "SHORT_ANSWER", "INVESTIGATION"];

export function QuestionForm({ action, q, topics, courses, isNew }: { action: (f: FormData) => Promise<void>; q?: QFormData; topics: { id: string; name: string }[]; courses: { id: string; title: string }[]; isNew: boolean }) {
  const [type, setType] = useState(q?.type ?? "SINGLE");
  const [opts, setOpts] = useState<Opt[]>(q?.options.length ? q.options : type === "TRUE_FALSE" ? [{ text: "True", isCorrect: true, matchText: null, explanation: null }, { text: "False", isCorrect: false, matchText: null, explanation: null }] : Array.from({ length: 4 }, () => ({ text: "", isCorrect: false, matchText: null, explanation: null })));
  const usesOptions = !["FILL_BLANK", "SHORT_ANSWER"].includes(type);
  const matching = type === "MATCHING";
  const single = ["SINGLE", "TRUE_FALSE", "SCENARIO"].includes(type);
  return (
    <form action={action} className="space-y-5">
      <section className="card grid gap-4 p-5 md:grid-cols-4">
        <div><label className="label" htmlFor="type">Type</label><Select id="type" name="type" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</Select></div>
        <div><label className="label" htmlFor="topicId">Topic</label><Select id="topicId" name="topicId" defaultValue={q?.topicId}>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></div>
        <div><label className="label" htmlFor="difficulty">Difficulty</label><Select id="difficulty" name="difficulty" defaultValue={q?.difficulty ?? "BEGINNER"}><option>BEGINNER</option><option>INTERMEDIATE</option><option>ADVANCED</option></Select></div>
        <div><label className="label" htmlFor="accessTier">Access</label><Select id="accessTier" name="accessTier" defaultValue={q?.accessTier ?? "PREMIUM"}><option>FREE</option><option>PREMIUM</option></Select></div>
        <div className="md:col-span-2"><label className="label" htmlFor="courseId">Course pool (final assessment)</label><Select id="courseId" name="courseId" defaultValue={q?.courseId ?? ""}><option value="">None</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select></div>
        <div className="md:col-span-2"><label className="label" htmlFor="tags">Tags (comma separated)</label><Input id="tags" name="tags" defaultValue={q?.tags.join(", ")} /></div>
      </section>
      <section className="card space-y-4 p-5">
        {(type === "SCENARIO" || type === "INVESTIGATION" || q?.scenario) && <div><label className="label" htmlFor="scenario">Scenario</label><Textarea id="scenario" name="scenario" defaultValue={q?.scenario ?? ""} /></div>}
        <div><label className="label" htmlFor="stem">Question text</label><Textarea id="stem" name="stem" defaultValue={q?.stem} required className="min-h-[80px]" /></div>
        {usesOptions && (
          <fieldset>
            <legend className="label">{matching ? "Matching pairs (left item → correct match)" : `Answer options — tick ${single ? "the one correct answer" : "all correct answers"}`}</legend>
            <div className="space-y-2">
              {opts.map((o, i) => (
                <div key={i} className="grid gap-2 rounded-lg border border-line p-2 md:grid-cols-[auto_1fr_1fr_auto] md:items-center">
                  {matching ? <span className="px-2 text-xs text-muted">{i + 1}</span> : <input type={single ? "radio" : "checkbox"} name="optCorrect" value={i} defaultChecked={o.isCorrect} aria-label={`Option ${i + 1} correct`} className="h-4 w-4" />}
                  <Input name="optText" defaultValue={o.text} placeholder={matching ? "Left item" : `Option ${String.fromCharCode(65 + i)}`} aria-label={`Option ${i + 1} text`} />
                  {matching ? <Input name="optMatch" defaultValue={o.matchText ?? ""} placeholder="Correct match" aria-label={`Option ${i + 1} match`} /> : <><input type="hidden" name="optMatch" value="" /><Input name="optExplanation" defaultValue={o.explanation ?? ""} placeholder="Why this option is right/wrong (optional)" aria-label={`Option ${i + 1} explanation`} /></>}
                  {matching && <input type="hidden" name="optExplanation" value="" />}
                  <button type="button" onClick={() => setOpts(opts.filter((_, j) => j !== i))} aria-label={`Remove option ${i + 1}`} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            {opts.length < 10 && <button type="button" onClick={() => setOpts([...opts, { text: "", isCorrect: false, matchText: null, explanation: null }])} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand"><Plus className="h-4 w-4" /> Add {matching ? "pair" : "option"}</button>}
          </fieldset>
        )}
        {(type === "FILL_BLANK" || type === "SHORT_ANSWER") && <div><label className="label" htmlFor="acceptedAnswers">Accepted answers (separate with |)</label><Input id="acceptedAnswers" name="acceptedAnswers" defaultValue={q?.acceptedAnswers.join("|")} /></div>}
        {type === "SHORT_ANSWER" && <>
          <div><label className="label" htmlFor="keywords">Keyword groups — one per line; alternatives separated by | (all groups must appear)</label><Textarea id="keywords" name="keywords" defaultValue={q?.keywords.join("\n")} /></div>
          <div><label className="label" htmlFor="modelAnswer">Model answer</label><Textarea id="modelAnswer" name="modelAnswer" defaultValue={q?.modelAnswer ?? ""} /></div>
        </>}
      </section>
      <section className="card space-y-4 p-5">
        <div><label className="label" htmlFor="explanation">Explanation of the correct answer</label><Textarea id="explanation" name="explanation" defaultValue={q?.explanation} required /></div>
        <div><label className="label" htmlFor="practicalApplication">Practical compliance application</label><Textarea id="practicalApplication" name="practicalApplication" defaultValue={q?.practicalApplication ?? ""} className="min-h-[70px]" /></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="label" htmlFor="sourceReference">Source reference</label><Input id="sourceReference" name="sourceReference" defaultValue={q?.sourceReference ?? ""} /></div>
          <div><label className="label" htmlFor="sourceUrl">Source URL</label><Input id="sourceUrl" name="sourceUrl" type="url" defaultValue={q?.sourceUrl ?? ""} /></div>
        </div>
        {!isNew && <div><label className="label" htmlFor="note">Change note (version history)</label><Input id="note" name="note" placeholder="What changed and why" /></div>}
        {isNew && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="allowDuplicate" /> Save even if a possible duplicate is detected</label>}
      </section>
      <div className="flex justify-end"><button type="submit" className="h-10 rounded-lg bg-navy px-5 text-sm font-medium text-white dark:bg-gold-400 dark:text-navy">{isNew ? "Create draft" : "Save new version"}</button></div>
    </form>
  );
}
