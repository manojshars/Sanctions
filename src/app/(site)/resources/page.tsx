import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText, Library, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/section";
import { TierBadge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { listLibraryResources } from "@/server/services/resources";
import { formatBytes } from "@/lib/utils";

export const metadata: Metadata = { title: "Resources", description: "Checklists, worksheets, reference cards and training materials from FinCrime Academy." };
export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const [resources, user] = await Promise.all([listLibraryResources(), getCurrentUser()]);
  return (
    <>
      <PageHeader eyebrow="Resources" title="Downloadable resources" description="Practical checklists, worksheets, reference cards and training materials. Course materials are available to learners enrolled in the related course." />
      <div className="container py-10">
        {resources.length === 0 && <p className="card p-6 text-sm text-muted">No resources are available yet.</p>}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <article key={r.id} className="card flex flex-col p-5">
              <div className="flex items-center justify-between"><FileText className="h-6 w-6 text-accent" /><TierBadge tier={r.accessTier} /></div>
              <h2 className="mt-3 font-semibold">{r.title}</h2>
              {r.description && <p className="mt-1 line-clamp-3 text-sm text-muted">{r.description}</p>}
              <p className="mt-2 flex-1 text-xs text-muted">
                {r.course ? `From: ${r.course.title}` : `Library · ${r.topic?.shortName ?? "General"}`}
                {r.mimeType === "application/pdf" && ` · PDF${r.sizeBytes ? ` · ${formatBytes(r.sizeBytes)}` : ""}${r.pageCount ? ` · ${r.pageCount} pages` : ""}`}
              </p>
              {r.course ? (
                <Link href={`/academy/courses/${r.course.slug}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"><Download className="h-4 w-4" /> Enrol to download</Link>
              ) : user ? (
                <a href={`/resources/${r.id}/download`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"><Download className="h-4 w-4" /> Download</a>
              ) : (
                <Link href="/login?next=/resources" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"><Download className="h-4 w-4" /> Sign in to download</Link>
              )}
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
