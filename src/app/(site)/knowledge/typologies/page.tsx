import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/section";
import { formatDate, titleCase, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Typology and Red-Flag Library", description: "Money laundering typologies, sanctions evasion indicators, fraud patterns, ABC and trade-based red flags." };
export const dynamic = "force-dynamic";
const CATS = ["MONEY_LAUNDERING", "SANCTIONS_EVASION", "FRAUD", "ABC", "TRADE_BASED", "CUSTOMER_RISK", "TRANSACTION"];

export default async function TypologiesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const items = await db.typology.findMany({ where: { status: "PUBLISHED", ...(category && CATS.includes(category) ? { category: category as never } : {}) }, orderBy: [{ category: "asc" }, { title: "asc" }] });
  return (
    <>
      <PageHeader eyebrow="Knowledge Hub" title="Typologies & Red Flags" description="Indicators to support detection and investigation. A red flag warrants enquiry — it is not proof of wrongdoing." />
      <div className="container py-10">
        <nav className="mb-6 flex flex-wrap gap-2" aria-label="Typology categories">
          <Link href="/knowledge/typologies" className={cn("rounded-full border px-3 py-1 text-sm", !category ? "border-navy bg-navy text-white dark:border-gold-400 dark:bg-gold-400 dark:text-navy" : "border-line")}>All</Link>
          {CATS.map((c) => <Link key={c} href={`/knowledge/typologies?category=${c}`} className={cn("rounded-full border px-3 py-1 text-sm", category === c ? "border-navy bg-navy text-white dark:border-gold-400 dark:bg-gold-400 dark:text-navy" : "border-line")}>{titleCase(c)}</Link>)}
        </nav>
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((t) => (
            <article key={t.id} id={t.slug} className="card p-6">
              <p className="eyebrow">{titleCase(t.category)}</p>
              <h2 className="mt-1 text-lg font-semibold">{t.title}</h2>
              <p className="mt-2 text-sm text-ink/85">{t.description}</p>
              <ul className="mt-4 space-y-1.5">{t.indicators.map((i) => <li key={i} className="flex gap-2 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />{i}</li>)}</ul>
              {t.example && <p className="mt-4 rounded-lg bg-surface-2 p-3 text-sm text-muted">{t.example}</p>}
              <p className="mt-4 text-xs text-muted">{t.sourceReference ? <>Source: {t.sourceUrl ? <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{t.sourceReference}</a> : t.sourceReference} · </> : null}Last reviewed {formatDate(t.lastReviewedAt)}</p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
