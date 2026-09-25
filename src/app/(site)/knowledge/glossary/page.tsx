import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/section";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Financial Crime Glossary", description: "Definitions of AML, sanctions, fraud and ABC terms with practical examples and sources." };
export const dynamic = "force-dynamic";

export default async function GlossaryPage({ searchParams }: { searchParams: Promise<{ q?: string; topic?: string; letter?: string }> }) {
  const sp = await searchParams;
  const [topics, terms] = await Promise.all([
    db.topic.findMany({ orderBy: { order: "asc" } }),
    db.glossaryTerm.findMany({
      where: { status: "PUBLISHED", ...(sp.topic ? { topic: { slug: sp.topic } } : {}), ...(sp.q ? { OR: [{ term: { contains: sp.q, mode: "insensitive" } }, { definition: { contains: sp.q, mode: "insensitive" } }] } : {}), ...(sp.letter ? { term: { startsWith: sp.letter, mode: "insensitive" } } : {}) },
      include: { topic: true }, orderBy: { term: "asc" },
    }),
  ]);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  return (
    <>
      <PageHeader eyebrow="Knowledge Hub" title="Glossary" description="Clear definitions with practical examples, related terms and source references." />
      <div className="container py-10">
        <form method="get" className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_220px_auto]" role="search">
          <Input name="q" defaultValue={sp.q} placeholder="Search terms and definitions" aria-label="Search glossary" />
          <Select name="topic" defaultValue={sp.topic ?? ""} aria-label="Topic"><option value="">All topics</option>{topics.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</Select>
          <Button type="submit">Search</Button>
        </form>
        <nav aria-label="Filter by letter" className="mb-6 flex flex-wrap gap-1">
          <Link href="/knowledge/glossary" className={cn("grid h-8 min-w-8 place-items-center rounded-md px-2 text-sm", !sp.letter ? "bg-navy text-white dark:bg-gold-400 dark:text-navy" : "hover:bg-surface-2")}>All</Link>
          {letters.map((l) => <Link key={l} href={`/knowledge/glossary?letter=${l}`} className={cn("grid h-8 w-8 place-items-center rounded-md text-sm", sp.letter === l ? "bg-navy text-white dark:bg-gold-400 dark:text-navy" : "hover:bg-surface-2")}>{l}</Link>)}
        </nav>
        {terms.length ? (
          <dl className="grid gap-4 md:grid-cols-2">
            {terms.map((t) => (
              <div key={t.id} className="card p-5">
                <dt className="flex items-start justify-between gap-2"><Link href={`/knowledge/glossary/${t.slug}`} className="font-semibold hover:text-brand">{t.term}</Link><Badge tone="brand">{t.topic.shortName}</Badge></dt>
                <dd className="mt-2 text-sm text-ink/85">{t.definition}</dd>
              </div>
            ))}
          </dl>
        ) : <EmptyState title="No matching terms" />}
      </div>
    </>
  );
}
