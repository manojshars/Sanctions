import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/section";
import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Regulatory Reference Library", description: "Official sources for OFAC, UN, EU, UK, FATF, FinCEN and Indian regulators — organised by authority and jurisdiction." };
export const dynamic = "force-dynamic";

export default async function RegulationsPage({ searchParams }: { searchParams: Promise<{ authority?: string; jurisdiction?: string; status?: string }> }) {
  const sp = await searchParams;
  const all = await db.regulatoryReference.findMany({ where: { status: "PUBLISHED" }, include: { topic: true }, orderBy: [{ jurisdiction: "asc" }, { authority: "asc" }, { title: "asc" }] });
  const authorities = [...new Set(all.map((r) => r.authority))].sort();
  const jurisdictions = [...new Set(all.map((r) => r.jurisdiction))].sort();
  const list = all.filter((r) => (!sp.authority || r.authority === sp.authority) && (!sp.jurisdiction || r.jurisdiction === sp.jurisdiction) && (!sp.status || r.regStatus === sp.status));
  const grouped = list.reduce<Record<string, typeof list>>((acc, r) => { (acc[r.jurisdiction] ??= []).push(r); return acc; }, {});
  return (
    <>
      <PageHeader eyebrow="Knowledge Hub" title="Regulatory Reference Library" description="Summaries with links to official sources. Dates are shown only where verified by our editors; always check the official source for the current text." />
      <div className="container py-10">
        <form method="get" className="card mb-6 grid gap-3 p-4 sm:grid-cols-4">
          <Select name="authority" defaultValue={sp.authority ?? ""} aria-label="Authority"><option value="">All authorities</option>{authorities.map((a) => <option key={a} value={a}>{a}</option>)}</Select>
          <Select name="jurisdiction" defaultValue={sp.jurisdiction ?? ""} aria-label="Jurisdiction"><option value="">All jurisdictions</option>{jurisdictions.map((a) => <option key={a} value={a}>{a}</option>)}</Select>
          <Select name="status" defaultValue={sp.status ?? ""} aria-label="Status"><option value="">Current and historical</option><option value="CURRENT">Current</option><option value="HISTORICAL">Historical</option></Select>
          <Button type="submit">Filter</Button>
        </form>
        <Alert tone="info" className="mb-8">References are educational summaries, not legal advice. Items marked <strong>Historical</strong> are retained for context and may have been superseded.</Alert>
        {Object.keys(grouped).length ? Object.entries(grouped).map(([j, items]) => (
          <section key={j} className="mb-10">
            <h2 className="mb-4 text-xl font-bold">{j}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((r) => (
                <article key={r.id} className="card flex flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2"><Badge tone="brand">{r.authority}</Badge>{r.regStatus === "HISTORICAL" ? <Badge tone="warning">Historical</Badge> : <Badge tone="success">Current</Badge>}{r.topic && <Badge tone="outline">{r.topic.shortName}</Badge>}</div>
                  <h3 className="mt-3 font-semibold leading-snug">{r.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-ink/85">{r.summary}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                    <div><dt>Published</dt><dd className="text-ink">{r.publishedDate ? formatDate(r.publishedDate) : "See official source"}</dd></div>
                    <div><dt>Effective</dt><dd className="text-ink">{r.effectiveDate ? formatDate(r.effectiveDate) : "See official source"}</dd></div>
                  </dl>
                  {r.dateNote && <p className="mt-2 text-xs text-muted">{r.dateNote}</p>}
                  <div className="mt-4 flex items-center justify-between text-xs text-muted"><span>Last reviewed {formatDate(r.lastReviewedAt)}</span><a href={r.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">Official source <ExternalLink className="h-3 w-3" /></a></div>
                </article>
              ))}
            </div>
          </section>
        )) : <EmptyState title="No references match your filters" />}
      </div>
    </>
  );
}
