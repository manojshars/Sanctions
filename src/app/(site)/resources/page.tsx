import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText, Library, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/section";
import { TierBadge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Resources", description: "Checklists, worksheets and reference cards from FinCrime Academy courses." };
export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const resources = await db.courseResource.findMany({ where: { course: { status: "PUBLISHED" } }, include: { course: { include: { topic: true } } }, orderBy: { title: "asc" } });
  return (
    <>
      <PageHeader eyebrow="Resources" title="Downloadable resources" description="Practical checklists, worksheets and reference cards. Downloads are available to learners enrolled in the related course." />
      <div className="container py-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <article key={r.id} className="card flex flex-col p-5">
              <div className="flex items-center justify-between"><FileText className="h-6 w-6 text-accent" /><TierBadge tier={r.accessTier} /></div>
              <h2 className="mt-3 font-semibold">{r.title}</h2>
              <p className="mt-1 flex-1 text-sm text-muted">From: {r.course.title}</p>
              <Link href={`/academy/courses/${r.course.slug}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"><Download className="h-4 w-4" /> Enrol to download</Link>
            </article>
          ))}
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Link href="/knowledge/regulations" className="card card-hover flex gap-4 p-5"><Library className="h-6 w-6 text-accent" /><span><span className="block font-semibold">Regulatory Reference Library</span><span className="text-sm text-muted">Official sources by authority</span></span></Link>
          <Link href="/knowledge/typologies" className="card card-hover flex gap-4 p-5"><ShieldAlert className="h-6 w-6 text-accent" /><span><span className="block font-semibold">Typologies & Red Flags</span><span className="text-sm text-muted">Indicators by risk area</span></span></Link>
        </div>
      </div>
    </>
  );
}
