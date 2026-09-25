import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { Prose } from "@/components/ui/prose";
import { HelpFeedback } from "@/components/support/ticket-forms";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await db.helpArticle.findFirst({ where: { slug: (await params).slug, status: "PUBLISHED" } });
  return a ? { title: a.title } : { title: "Help article not found" };
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = await db.helpArticle.findFirst({ where: { slug: (await params).slug, status: "PUBLISHED" } });
  if (!a) notFound();
  const related = await db.helpArticle.findMany({ where: { slug: { in: a.relatedSlugs }, status: "PUBLISHED" } });
  return (
    <div className="container grid max-w-5xl gap-8 py-10 lg:grid-cols-[1fr_280px]">
      <article>
        <Link href="/support" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Support Center</Link>
        <p className="eyebrow mt-4">{a.category}</p>
        <h1 className="mt-1 text-3xl font-bold">{a.title}</h1>
        <p className="mt-1 text-sm text-muted">Last updated {formatDate(a.updatedAt)}</p>
        <div className="card mt-6 p-6"><Prose markdown={a.content} /></div>
        <div className="mt-6"><HelpFeedback articleId={a.id} /></div>
        <p className="mt-6 text-sm text-muted">Still need help? <Link href="/support/new" className="text-brand underline">Contact support</Link>.</p>
      </article>
      <aside>{related.length > 0 && <div className="card p-5"><h2 className="font-semibold">Related articles</h2><ul className="mt-2 space-y-1.5 text-sm">{related.map((r) => <li key={r.id}><Link href={`/support/help/${r.slug}`} className="text-brand hover:underline">{r.title}</Link></li>)}</ul></div>}</aside>
    </div>
  );
}
