import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { BookmarkButton } from "@/components/common/bookmark-button";
import { formatDate, slugify } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = await db.glossaryTerm.findFirst({ where: { slug: (await params).slug, status: "PUBLISHED" } });
  return t ? { title: `${t.term} — definition`, description: t.definition } : { title: "Term not found" };
}

export default async function TermPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = await db.glossaryTerm.findFirst({ where: { slug: (await params).slug, status: "PUBLISHED" }, include: { topic: true } });
  if (!t) notFound();
  const user = await getCurrentUser();
  const saved = user ? !!(await db.bookmark.findFirst({ where: { userId: user.id, entityType: "GLOSSARY", entityId: t.id } })) : false;
  const related = await db.glossaryTerm.findMany({ where: { slug: { in: t.relatedTerms.map(slugify) } }, select: { slug: true, term: true } });
  const ld = { "@context": "https://schema.org", "@type": "DefinedTerm", name: t.term, description: t.definition, inDefinedTermSet: "FinCrime Academy Glossary" };
  return (
    <div className="container max-w-3xl py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Link href="/knowledge/glossary" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Glossary</Link>
      <div className="mt-4"><Badge tone="brand">{t.topic.name}</Badge></div>
      <h1 className="mt-3 text-3xl font-bold">{t.term}</h1>
      <div className="card mt-6 space-y-5 p-6">
        <section><h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Definition</h2><p className="mt-1 text-lg">{t.definition}</p></section>
        {t.example && <section><h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Practical example</h2><p className="mt-1">{t.example}</p></section>}
        {related.length > 0 && <section><h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Related terms</h2><ul className="mt-1 flex flex-wrap gap-2">{related.map((r) => <li key={r.slug}><Link href={`/knowledge/glossary/${r.slug}`} className="rounded-full border border-line px-3 py-1 text-sm hover:bg-surface-2">{r.term}</Link></li>)}</ul></section>}
        <section className="text-sm text-muted">Source: {t.sourceReference ? (t.sourceUrl ? <a href={t.sourceUrl} className="underline" target="_blank" rel="noopener noreferrer">{t.sourceReference}</a> : t.sourceReference) : "FinCrime Academy editorial definition"} · Last reviewed {formatDate(t.lastReviewedAt)}</section>
      </div>
      {user && <div className="mt-4"><BookmarkButton entityType="GLOSSARY" entityId={t.id} initial={saved} /></div>}
    </div>
  );
}
