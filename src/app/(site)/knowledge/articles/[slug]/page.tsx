import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { Prose } from "@/components/ui/prose";
import { Badge } from "@/components/ui/badge";
import { BookmarkButton } from "@/components/common/bookmark-button";
import { appUrl, formatDate, titleCase } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await db.article.findFirst({ where: { slug: (await params).slug, status: "PUBLISHED" } });
  return a ? { title: a.title, description: a.excerpt, openGraph: { title: a.title, description: a.excerpt, type: "article" } } : { title: "Article not found" };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await db.article.findFirst({ where: { slug, status: "PUBLISHED" }, include: { topic: true } });
  if (!a) notFound();
  const user = await getCurrentUser();
  const saved = user ? !!(await db.bookmark.findFirst({ where: { userId: user.id, entityType: "ARTICLE", entityId: a.id } })) : false;
  const sources = a.sources as { title: string; url: string }[];
  const related = await db.article.findMany({ where: { status: "PUBLISHED", id: { not: a.id }, OR: [{ topicId: a.topicId }, { category: a.category }] }, take: 3 });
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.excerpt, datePublished: a.publishedAt?.toISOString(), dateModified: a.lastReviewedAt.toISOString(), author: { "@type": "Organization", name: a.authorName }, publisher: { "@type": "Organization", name: "FinCrime Academy", url: appUrl() } };
  return (
    <article className="container max-w-3xl py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Link href="/knowledge" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Knowledge Hub</Link>
      <div className="mt-4 flex flex-wrap gap-2"><Badge tone="outline">{titleCase(a.category)}</Badge>{a.topic && <Badge tone="brand">{a.topic.name}</Badge>}</div>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{a.title}</h1>
      <p className="mt-3 text-lg text-muted">{a.excerpt}</p>
      <p className="mt-4 text-sm text-muted">{a.authorName} · Published {formatDate(a.publishedAt)} · Last reviewed {formatDate(a.lastReviewedAt)} · {a.readingMinutes} min read</p>
      {user && <div className="mt-4"><BookmarkButton entityType="ARTICLE" entityId={a.id} initial={saved} /></div>}
      <div className="card mt-8 p-6 sm:p-8"><Prose markdown={a.content} /></div>
      {sources.length > 0 && <section className="mt-6"><h2 className="font-semibold">Sources</h2><ul className="mt-2 space-y-1 text-sm">{sources.map((s) => <li key={s.url + s.title}><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand underline">{s.title}</a></li>)}</ul></section>}
      <p className="mt-6 text-xs text-muted">Educational content only — not legal advice. Always refer to the current official source.</p>
      {related.length > 0 && <section className="mt-10"><h2 className="font-semibold">Related articles</h2><ul className="mt-3 space-y-2">{related.map((r) => <li key={r.id}><Link href={`/knowledge/articles/${r.slug}`} className="text-brand hover:underline">{r.title}</Link></li>)}</ul></section>}
    </article>
  );
}
