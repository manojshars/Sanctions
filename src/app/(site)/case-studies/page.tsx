import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/section";
import { Badge, LevelBadge, TierBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { titleCase, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Case Studies", description: "Interactive financial crime investigation simulations using fictional training scenarios." };
export const dynamic = "force-dynamic";

const CATS = ["AML_INVESTIGATION", "SANCTIONS_EXPOSURE", "OWNERSHIP_CONTROL", "SCREENING_ALERT", "TRANSACTION_MONITORING", "FRAUD_INVESTIGATION", "ABC_INVESTIGATION", "TBML", "EXPORT_CONTROL", "CRYPTO"];

export default async function CaseStudiesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const cases = await db.caseStudy.findMany({ where: { status: "PUBLISHED", ...(category && CATS.includes(category) ? { category: category as never } : {}) }, include: { topic: true }, orderBy: [{ featured: "desc" }, { title: "asc" }] });
  return (
    <>
      <PageHeader eyebrow="Investigation Center" title="Case Study Library" description="Work through realistic scenarios: review documents, identify red flags, request information, weigh explanations and submit a recommendation — then compare with model reasoning." />
      <div className="container py-10">
        <p className="mb-5 rounded-xl border border-gold-400/40 bg-gold-400/5 p-4 text-sm">All training cases are <strong>fictional and anonymised</strong>. Names, entities and data are invented for educational purposes and do not refer to real persons or enforcement actions.</p>
        <nav aria-label="Case categories" className="mb-6 flex flex-wrap gap-2">
          <Link href="/case-studies" className={cn("rounded-full border px-3 py-1 text-sm", !category ? "border-navy bg-navy text-white dark:border-gold-400 dark:bg-gold-400 dark:text-navy" : "border-line hover:bg-surface-2")}>All</Link>
          {CATS.map((c) => <Link key={c} href={`/case-studies?category=${c}`} className={cn("rounded-full border px-3 py-1 text-sm", category === c ? "border-navy bg-navy text-white dark:border-gold-400 dark:bg-gold-400 dark:text-navy" : "border-line hover:bg-surface-2")}>{titleCase(c)}</Link>)}
        </nav>
        {cases.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <article key={c.id} className="card card-hover relative flex flex-col p-6">
                <div className="flex flex-wrap gap-2"><Badge tone="gold">{c.isFictional ? "Fictional" : "Enforcement-based"}</Badge><Badge tone="brand">{titleCase(c.category)}</Badge></div>
                <h2 className="mt-3 text-lg font-semibold"><Link href={`/case-studies/${c.slug}`} className="after:absolute after:inset-0">{c.title}</Link></h2>
                <p className="mt-2 flex-1 text-sm text-muted">{c.summary}</p>
                <div className="mt-4 flex items-center gap-2"><LevelBadge level={c.difficulty} /><TierBadge tier={c.accessTier} /><span className="ml-auto inline-flex items-center gap-1 text-xs text-muted"><ClipboardCheck className="h-3.5 w-3.5" /> {(c.simulation as { steps?: unknown[] }).steps?.length ?? 0}-step simulation</span></div>
              </article>
            ))}
          </div>
        ) : <EmptyState title="No case studies in this category yet" />}
      </div>
    </>
  );
}
