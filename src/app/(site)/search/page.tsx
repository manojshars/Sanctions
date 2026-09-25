import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { db } from "@/lib/db";
import { searchAll, SEARCH_LABELS, SEARCH_TYPES, type SearchType } from "@/server/services/search";
import { SearchBox } from "@/components/search/search-box";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Search", robots: { index: false } };
export const dynamic = "force-dynamic";

const POPULAR = ["beneficial ownership", "50 percent rule", "structuring", "travel rule", "PEP", "mule", "letter of credit", "facilitation payment"];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; topic?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const type = SEARCH_TYPES.includes(sp.type as SearchType) ? (sp.type as SearchType) : undefined;
  const [topics, results] = await Promise.all([db.topic.findMany({ orderBy: { order: "asc" } }), searchAll(q, { types: type ? [type] : undefined, topic: sp.topic, limit: type ? 30 : 6 })]);
  const total = Object.values(results).reduce((s, r) => s + r.length, 0);
  const link = (over: Record<string, string | undefined>) => { const p = new URLSearchParams(); const m = { q, type, topic: sp.topic, ...over }; for (const [k, v] of Object.entries(m)) if (v) p.set(k, v); return `/search?${p}`; };
  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-3xl font-bold">Search</h1>
      <div className="mt-5"><SearchBox initial={q} topic={sp.topic} type={type} /></div>
      <div className="mt-5 flex flex-wrap gap-2" aria-label="Category filters">
        <Link href={link({ type: undefined })} className={cn("rounded-full border px-3 py-1 text-sm", !type ? "border-navy bg-navy text-white dark:border-gold-400 dark:bg-gold-400 dark:text-navy" : "border-line")}>All</Link>
        {SEARCH_TYPES.map((t) => <Link key={t} href={link({ type: t })} className={cn("rounded-full border px-3 py-1 text-sm", type === t ? "border-navy bg-navy text-white dark:border-gold-400 dark:bg-gold-400 dark:text-navy" : "border-line")}>{SEARCH_LABELS[t]}{q && results[t].length ? ` (${results[t].length})` : ""}</Link>)}
      </div>
      <form method="get" className="mt-3 flex items-center gap-2 text-sm">
        <input type="hidden" name="q" value={q} />{type && <input type="hidden" name="type" value={type} />}
        <label htmlFor="topic" className="text-muted">Topic</label>
        <select id="topic" name="topic" defaultValue={sp.topic ?? ""} className="input w-auto py-1.5"><option value="">All topics</option>{topics.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select>
        <button type="submit" className="rounded-lg border border-line px-3 py-1.5 hover:bg-surface-2">Apply</button>
      </form>
      {!q ? (
        <div className="mt-10"><p className="text-sm font-semibold">Popular searches</p><div className="mt-3 flex flex-wrap gap-2">{POPULAR.map((p) => <Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="rounded-full bg-surface-2 px-3 py-1.5 text-sm hover:bg-line">{p}</Link>)}</div></div>
      ) : total === 0 ? (
        <EmptyState className="mt-10" icon={SearchX} title={`No results for “${q}”`} description="Check the spelling, try a broader term, or remove filters." action={<div className="flex flex-wrap justify-center gap-2">{POPULAR.slice(0, 4).map((p) => <Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="rounded-full bg-surface-2 px-3 py-1.5 text-sm">{p}</Link>)}</div>} />
      ) : (
        <div className="mt-8 space-y-8" aria-live="polite">
          <p className="text-sm text-muted">{total} result{total === 1 ? "" : "s"} for “{q}”</p>
          {SEARCH_TYPES.filter((t) => results[t].length).map((t) => (
            <section key={t}>
              <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">{SEARCH_LABELS[t]}</h2>{!type && results[t].length >= 6 && <Link href={link({ type: t })} className="text-sm font-semibold text-brand">See all</Link>}</div>
              <ul className="space-y-2">{results[t].map((h) => (
                <li key={h.id}><Link href={h.href} className="card card-hover block p-4">
                  <span className="flex items-start justify-between gap-3"><span className="font-semibold">{h.title}</span>{h.topic && <Badge tone="brand">{h.topic}</Badge>}</span>
                  <span className="mt-1 block text-sm text-muted line-clamp-2">{h.snippet}</span>
                </Link></li>
              ))}</ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
