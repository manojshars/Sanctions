import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, BookOpen, FileSearch, Lock, Scale } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { caseAccess, publicSimulation, type Simulation } from "@/server/services/cases";
import { CaseSimulation } from "@/components/cases/simulation";
import { Breadcrumbs } from "@/components/ui/section";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { BookmarkButton } from "@/components/common/bookmark-button";
import { titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await db.caseStudy.findFirst({ where: { slug: (await params).slug, status: "PUBLISHED" }, select: { title: true, summary: true } });
  return c ? { title: c.title, description: c.summary } : { title: "Case not found" };
}

function List({ title, items, icon: Icon }: { title: string; items: string[]; icon: typeof Scale }) {
  return (
    <section className="card p-5">
      <h2 className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-accent" />{title}</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink/85">{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </section>
  );
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await db.caseStudy.findFirst({ where: { slug, status: "PUBLISHED" }, include: { topic: true } });
  if (!c) notFound();
  const user = await getCurrentUser();
  const allowed = await caseAccess(user, c);
  const sim = publicSimulation(c.simulation as unknown as Simulation);
  const refs = c.references as { title: string; url: string }[];
  const followUps = c.followUpQuestions as { q: string; a: string }[];
  const saved = user ? !!(await db.bookmark.findFirst({ where: { userId: user.id, entityType: "CASE_STUDY", entityId: c.id } })) : false;
  return (
    <>
      <section className="bg-navy text-white"><div className="container py-10">
        <Breadcrumbs items={[{ label: "Case Studies", href: "/case-studies" }, { label: c.title }]} />
        <div className="flex flex-wrap gap-2"><Badge tone="gold">{c.isFictional ? "Fictional training case" : "Based on public enforcement"}</Badge><Badge tone="brand">{titleCase(c.category)}</Badge><LevelBadge level={c.difficulty} /></div>
        <h1 className="mt-3 text-3xl font-bold">{c.title}</h1>
        <p className="mt-2 max-w-3xl text-white/75">{c.summary}</p>
        {user && <div className="mt-4"><BookmarkButton entityType="CASE_STUDY" entityId={c.id} initial={saved} label="Save case" /></div>}
      </div></section>
      <div className="container space-y-8 py-10">
        {!allowed ? (
          <div className="card mx-auto max-w-xl p-8 text-center"><Lock className="mx-auto h-8 w-8 text-accent" /><h2 className="mt-3 text-xl font-bold">Premium case study</h2><p className="mt-2 text-muted">Full case materials and the interactive simulation are available with Premium or a relevant package.</p><ButtonLink href="/pricing" className="mt-5">View plans</ButtonLink></div>
        ) : (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="card p-5"><h2 className="font-semibold">Background</h2><p className="mt-2 text-sm leading-relaxed text-ink/85">{c.background}</p></section>
              <section className="card p-5"><h2 className="font-semibold">Customer / counterparty profile</h2><p className="mt-2 text-sm leading-relaxed text-ink/85">{c.profile}</p></section>
              <section className="card p-5"><h2 className="font-semibold">Transaction details</h2><p className="mt-2 text-sm leading-relaxed text-ink/85">{c.transactionDetails}</p></section>
              <section className="card p-5"><h2 className="font-semibold">Business context</h2><p className="mt-2 text-sm leading-relaxed text-ink/85">{c.businessContext}</p></section>
            </div>
            <section>
              <h2 className="mb-2 text-xl font-bold">Interactive investigation</h2>
              <p className="mb-5 text-sm text-muted">Work through the simulation before reading the analysis below.</p>
              {user ? <CaseSimulation slug={c.slug} documents={sim.documents} steps={sim.steps} /> : <div className="card p-6"><p>Sign in to run the simulation and record your results.</p><ButtonLink href={`/login?next=/case-studies/${c.slug}`} className="mt-3">Sign in</ButtonLink></div>}
            </section>
            <details className="card group p-0">
              <summary className="cursor-pointer list-none p-5 text-lg font-bold">Case analysis & educational conclusion <span className="text-sm font-normal text-muted">(reveal after attempting the simulation)</span></summary>
              <div className="space-y-5 border-t border-line p-5">
                <div className="grid gap-5 lg:grid-cols-2">
                  <List title="Potential red flags" items={c.redFlags} icon={AlertTriangle} />
                  <List title="Risk indicators" items={c.riskIndicators} icon={Scale} />
                  <List title="Investigation questions" items={c.investigationQuestions} icon={FileSearch} />
                  <List title="Evidence required" items={c.evidenceRequired} icon={FileSearch} />
                </div>
                <section className="card p-5"><h2 className="font-semibold">Investigation steps</h2><ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">{c.investigationSteps.map((s) => <li key={s}>{s}</li>)}</ol></section>
                <section className="card p-5"><h2 className="font-semibold">Possible findings</h2><p className="mt-2 text-sm text-ink/85">{c.possibleFindings}</p></section>
                <List title="Alternative explanations" items={c.alternativeExplanations} icon={Scale} />
                <section className="card p-5"><h2 className="font-semibold">Risk assessment considerations</h2><p className="mt-2 text-sm text-ink/85">{c.riskConsiderations}</p></section>
                <section className="rounded-2xl border border-gold-400/50 bg-gold-400/5 p-5"><h2 className="font-semibold">Educational conclusion</h2><p className="mt-2 text-sm text-ink/90">{c.conclusion}</p></section>
                <section className="card p-5"><h2 className="flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4 text-accent" /> Regulatory references</h2><ul className="mt-2 space-y-1 text-sm">{refs.map((r) => <li key={r.url + r.title}><a href={r.url} target="_blank" rel="noopener noreferrer" className="text-brand underline">{r.title}</a></li>)}</ul></section>
                <section className="card p-5"><h2 className="font-semibold">Follow-up knowledge questions</h2>
                  <ul className="mt-3 space-y-3">{followUps.map((f) => <li key={f.q}><details><summary className="cursor-pointer text-sm font-medium">{f.q}</summary><p className="mt-1 pl-4 text-sm text-muted">{f.a}</p></details></li>)}</ul></section>
              </div>
            </details>
          </>
        )}
      </div>
    </>
  );
}
