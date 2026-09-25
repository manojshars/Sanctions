import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked, Library, Newspaper, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { formatDate, titleCase, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Knowledge Hub", description: "Articles, regulatory explainers, glossary, regulatory library and red-flag typologies." };
export const dynamic = "force-dynamic";
const CATS = ["EDUCATIONAL", "REGULATORY_EXPLAINER", "TRENDS", "INVESTIGATION_GUIDE", "CASE_ANALYSIS", "CONTROL_GUIDANCE"];

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const [articles, counts] = await Promise.all([
    db.article.findMany({ where: { status: "PUBLISHED", ...(category && CATS.includes(category) ? { category: category as never } : {}) }, include: { topic: true }, orderBy: { publishedAt: "desc" } }),
    Promise.all([db.glossaryTerm.count({ where: { status: "PUBLISHED" } }), db.regulatoryReference.count({ where: { status: "PUBLISHED" } }), db.typology.count({ where: { status: "PUBLISHED" } })]),
  ]);
  const tiles = [
    { href: "/knowledge/glossary", icon: BookMarked, title: "Glossary", d: `${counts[0]} financial crime terms with examples and sources` },
    { href: "/knowledge/regulations", icon: Library, title: "Regulatory Library", d: `${counts[1]} references by authority and jurisdiction` },
    { href: "/knowledge/typologies", icon: ShieldAlert, title: "Typologies & Red Flags", d: `${counts[2]} typologies with indicators` },
  ];
  return (
    <>
      <PageHeader eyebrow="Knowledge Hub" title="Financial crime knowledge, explained" description="Plain-English explainers, practical guides and reference material — with sources and review dates." />
      <div className="container py-10">
        <div className="grid gap-4 md:grid-cols-3">{tiles.map(({ href, icon: I, title, d }) => <Link key={href} href={href} className="card card-hover flex gap-4 p-5"><I className="h-6 w-6 shrink-0 text-accent" /><span><span className="block font-semibold">{title}</span><span className="text-sm text-muted">{d}</span></span></Link>)}</div>
        <h2 className="mt-12 text-xl font-bold">Articles & professional insights</h2>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Article categories">
          <Link href="/knowledge" className={cn("rounded-full border px-3 py-1 text-sm", !category ? "border-navy bg-navy text-white dark:border-gold-400 dark:bg-gold-400 dark:text-navy" : "border-line")}>All</Link>
          {CATS.map((c) => <Link key={c} href={`/knowledge?category=${c}`} className={cn("rounded-full border px-3 py-1 text-sm", category === c ? "border-navy bg-navy text-white dark:border-gold-400 dark:bg-gold-400 dark:text-navy" : "border-line")}>{titleCase(c)}</Link>)}
        </nav>
        {articles.length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.id} href={`/knowledge/articles/${a.slug}`} className="card card-hover flex flex-col p-5">
                <div className="flex items-center gap-2"><Newspaper className="h-4 w-4 text-accent" /><Badge tone="outline">{titleCase(a.category)}</Badge></div>
                <h3 className="mt-3 font-semibold leading-snug">{a.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted">{a.excerpt}</p>
                <p className="mt-4 text-xs text-muted">{a.readingMinutes} min read · Reviewed {formatDate(a.lastReviewedAt)}</p>
              </Link>
            ))}
          </div>
        ) : <EmptyState className="mt-6" title="No articles in this category yet" />}
      </div>
    </>
  );
}
