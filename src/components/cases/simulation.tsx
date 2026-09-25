"use client";
import { useState, useTransition } from "react";
import { CheckCircle2, FileText, Loader2, XCircle } from "lucide-react";
import { submitCaseAction } from "@/server/actions/cases";
import { Button } from "@/components/ui/button";
import { Alert, Progress, Ring } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

type Step = { id: string; kind: string; prompt: string; multi: boolean; options: { id: string; text: string }[] };
type Result = Awaited<ReturnType<typeof submitCaseAction>>;
const KIND: Record<string, string> = { questions: "Select investigation questions", indicators: "Identify risk indicators", request: "Request additional information", explanations: "Evaluate explanations", recommendation: "Submit a recommendation" };

export function CaseSimulation({ slug, documents, steps }: { slug: string; documents: { id: string; title: string; content: string }[]; steps: Step[] }) {
  const [i, setI] = useState(0);
  const [resp, setResp] = useState<Record<string, string[]>>({});
  const [rec, setRec] = useState("");
  const [doc, setDoc] = useState(documents[0]?.id);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const step = steps[i];
  const last = i === steps.length - 1;

  if (result?.ok) {
    const r = result.result;
    return (
      <div className="space-y-5">
        <div className="card flex flex-col items-center gap-4 p-6 sm:flex-row">
          <Ring value={r.total} label="Simulation score" />
          <div><p className="text-lg font-bold">Simulation complete</p><p className="text-sm text-muted">Review the feedback for each step and compare your reasoning with the model reasoning.</p></div>
        </div>
        {r.steps.map((s, k) => (
          <div key={s.id} className="card p-5">
            <div className="flex items-center justify-between gap-3"><p className="font-semibold">Step {k + 1}: {s.prompt}</p><span className="text-sm text-muted">{Math.round(s.score * 100)}%</span></div>
            <ul className="mt-3 space-y-2">
              {s.options.map((o) => {
                const picked = s.picked.includes(o.id);
                return (
                  <li key={o.id} className={cn("rounded-lg border p-3 text-sm", o.correct ? "border-success/40 bg-success/5" : picked ? "border-danger/40 bg-danger/5" : "border-line")}>
                    <p className="flex items-center gap-2 font-medium">{o.correct ? <CheckCircle2 className="h-4 w-4 text-success" /> : picked ? <XCircle className="h-4 w-4 text-danger" /> : <span className="h-4 w-4" />}{o.text}{picked && <span className="ml-auto text-xs text-muted">your choice</span>}</p>
                    {o.feedback && <p className="mt-1 pl-6 text-muted">{o.feedback}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="card border-gold-400/50 p-5"><h3 className="font-semibold">Model reasoning</h3><p className="mt-2 text-sm leading-relaxed text-ink/85">{r.modelReasoning}</p></div>
        {rec && <div className="card p-5"><h3 className="font-semibold">Your written recommendation</h3><p className="mt-2 whitespace-pre-wrap text-sm text-ink/85">{rec}</p></div>}
        <Button variant="secondary" onClick={() => { setResult(null); setResp({}); setI(0); setRec(""); }}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="card p-5">
        <p className="text-sm font-semibold">Case documents</p>
        <div className="mt-3 flex flex-wrap gap-2" role="tablist">
          {documents.map((d) => <button key={d.id} role="tab" aria-selected={doc === d.id} onClick={() => setDoc(d.id)} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium", doc === d.id ? "border-brand bg-brand/5 text-brand" : "border-line text-muted")}><FileText className="h-3.5 w-3.5" />{d.title}</button>)}
        </div>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-surface-2 p-4 font-mono text-xs leading-relaxed text-ink/90" role="tabpanel">{documents.find((d) => d.id === doc)?.content}</pre>
      </div>
      <div className="card p-5">
        <div className="flex items-center justify-between text-sm text-muted"><span>Step {i + 1} of {steps.length} · {KIND[step.kind] ?? step.kind}</span></div>
        <Progress value={((i + 1) / steps.length) * 100} className="mt-2" label="Simulation progress" />
        <fieldset className="mt-5">
          <legend className="font-semibold">{step.prompt}</legend>
          <p className="text-xs text-muted">{step.multi ? "Select all that apply." : "Select one."}</p>
          <div className="mt-3 space-y-2">
            {step.options.map((o) => {
              const sel = (resp[step.id] ?? []).includes(o.id);
              return (
                <label key={o.id} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm", sel ? "border-brand bg-brand/5" : "border-line hover:border-brand/40")}>
                  <input type={step.multi ? "checkbox" : "radio"} name={step.id} checked={sel} className="mt-0.5 accent-[#193B68]"
                    onChange={() => setResp((r) => ({ ...r, [step.id]: step.multi ? (sel ? r[step.id].filter((x) => x !== o.id) : [...(r[step.id] ?? []), o.id]) : [o.id] }))} />
                  {o.text}
                </label>
              );
            })}
          </div>
        </fieldset>
        {last && (
          <div className="mt-5"><label htmlFor="rec" className="label">Your written recommendation (optional)</label>
            <textarea id="rec" className="input min-h-[100px]" maxLength={5000} value={rec} onChange={(e) => setRec(e.target.value)} placeholder="Summarise your conclusion and proposed actions…" /></div>
        )}
        {result && !result.ok && <Alert tone="danger" className="mt-4">{result.error}</Alert>}
        <div className="mt-5 flex justify-between gap-2">
          <Button variant="secondary" disabled={i === 0} onClick={() => setI(i - 1)}>Back</Button>
          {last ? (
            <Button variant="gold" disabled={pending} onClick={() => start(async () => setResult(await submitCaseAction(slug, { responses: resp, recommendation: rec })))}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} Submit & review feedback</Button>
          ) : <Button onClick={() => setI(i + 1)} disabled={!(resp[step.id]?.length)}>Next step</Button>}
        </div>
      </div>
    </div>
  );
}
