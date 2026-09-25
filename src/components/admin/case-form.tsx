import { L, SubmitBar } from "./ui";
import { Input, Select, Textarea } from "@/components/ui/form";

export type CaseFormData = {
  title: string; summary: string; category: string; topicId: string; difficulty: string; accessTier: string; isFictional: boolean; featured: boolean; status: string;
  background: string; profile: string; transactionDetails: string; businessContext: string; redFlags: string[]; riskIndicators: string[]; investigationQuestions: string[];
  evidenceRequired: string[]; investigationSteps: string[]; possibleFindings: string; alternativeExplanations: string[]; riskConsiderations: string; conclusion: string;
  references: unknown; followUpQuestions: unknown; simulation: unknown;
};

const SAMPLE_SIM = JSON.stringify({ documents: [{ id: "d1", title: "Document", content: "…" }], steps: [{ id: "s1", kind: "indicators", prompt: "Which red flags are present?", multi: true, options: [{ id: "a", text: "…", correct: true, feedback: "…" }, { id: "b", text: "…", correct: false, feedback: "…" }] }], modelReasoning: "…" }, null, 2);
const CATS = ["AML_INVESTIGATION", "SANCTIONS_EXPOSURE", "OWNERSHIP_CONTROL", "SCREENING_ALERT", "TRANSACTION_MONITORING", "FRAUD_INVESTIGATION", "ABC_INVESTIGATION", "TBML", "EXPORT_CONTROL", "CRYPTO"];

export function CaseForm({ action, c, topics }: { action: (f: FormData) => Promise<void>; c?: CaseFormData; topics: { id: string; name: string }[] }) {
  const refs = (c?.references as { title: string; url: string }[] | undefined)?.map((r) => `${r.title} | ${r.url}`).join("\n") ?? "";
  const fus = (c?.followUpQuestions as { q: string; a: string }[] | undefined)?.map((f) => `${f.q} | ${f.a}`).join("\n") ?? "";
  const ta = (name: string, label: string, value?: string, hint?: string) => <L label={label} htmlFor={name} hint={hint}><Textarea id={name} name={name} defaultValue={value} className="min-h-[80px]" /></L>;
  return (
    <form action={action} className="space-y-5">
      <section className="card grid gap-4 p-5 md:grid-cols-3">
        <div className="md:col-span-2"><L label="Title" htmlFor="title"><Input id="title" name="title" defaultValue={c?.title} required /></L></div>
        <L label="Category" htmlFor="category"><Select id="category" name="category" defaultValue={c?.category}>{CATS.map((x) => <option key={x}>{x}</option>)}</Select></L>
        <div className="md:col-span-3"><L label="Summary" htmlFor="summary"><Input id="summary" name="summary" defaultValue={c?.summary} required /></L></div>
        <L label="Topic" htmlFor="topicId"><Select id="topicId" name="topicId" defaultValue={c?.topicId}>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></L>
        <L label="Difficulty" htmlFor="difficulty"><Select id="difficulty" name="difficulty" defaultValue={c?.difficulty ?? "INTERMEDIATE"}><option>BEGINNER</option><option>INTERMEDIATE</option><option>ADVANCED</option></Select></L>
        <div className="grid grid-cols-2 gap-2"><L label="Access" htmlFor="accessTier"><Select id="accessTier" name="accessTier" defaultValue={c?.accessTier ?? "PREMIUM"}><option>FREE</option><option>PREMIUM</option></Select></L><L label="Status" htmlFor="status"><Select id="status" name="status" defaultValue={c?.status ?? "DRAFT"}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></Select></L></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFictional" defaultChecked={c?.isFictional ?? true} /> Fictional training case</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={c?.featured} /> Feature as Case of the Week</label>
      </section>
      <section className="card grid gap-4 p-5 md:grid-cols-2">
        {ta("background", "Background", c?.background)}{ta("profile", "Customer / counterparty profile", c?.profile)}
        {ta("transactionDetails", "Transaction details", c?.transactionDetails)}{ta("businessContext", "Business context", c?.businessContext)}
        {ta("redFlags", "Potential red flags", c?.redFlags.join("\n"), "One per line")}{ta("riskIndicators", "Risk indicators", c?.riskIndicators.join("\n"), "One per line")}
        {ta("investigationQuestions", "Investigation questions", c?.investigationQuestions.join("\n"), "One per line")}{ta("evidenceRequired", "Evidence required", c?.evidenceRequired.join("\n"), "One per line")}
        {ta("investigationSteps", "Investigation steps", c?.investigationSteps.join("\n"), "One per line")}{ta("possibleFindings", "Possible findings", c?.possibleFindings)}
        {ta("alternativeExplanations", "Alternative explanations", c?.alternativeExplanations.join("\n"), "One per line")}{ta("riskConsiderations", "Risk assessment considerations", c?.riskConsiderations)}
        {ta("conclusion", "Educational conclusion", c?.conclusion)}{ta("references", "Regulatory references", refs, "One per line: Title | https://official-url")}
        {ta("followUps", "Follow-up questions", fus, "One per line: Question | Answer")}
      </section>
      <section className="card p-5">
        <L label="Simulation (JSON)" htmlFor="simulationJson" hint="documents[], steps[] (kind: questions | indicators | request | explanations | recommendation; each option has id, text, correct, feedback), modelReasoning"><Textarea id="simulationJson" name="simulationJson" defaultValue={c ? JSON.stringify(c.simulation, null, 2) : SAMPLE_SIM} className="min-h-[320px] font-mono text-xs" /></L>
      </section>
      <SubmitBar label={c ? "Save case study" : "Create case study"} />
    </form>
  );
}
