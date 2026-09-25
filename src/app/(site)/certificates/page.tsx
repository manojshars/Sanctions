import type { Metadata } from "next";
import Link from "next/link";
import { Award } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Certificates", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const user = await requireUser("/certificates");
  const certs = await db.certificate.findMany({ where: { userId: user.id }, orderBy: { issuedAt: "desc" } });
  return (
    <div className="container py-10">
      <p className="eyebrow">Certificates</p>
      <h1 className="mt-1 text-3xl font-bold">Your certificates</h1>
      <p className="mt-1 max-w-2xl text-muted">Internal completion certificates for courses you have completed. Each includes a unique verification code that anyone can check.</p>
      {certs.length ? (
        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{certs.map((c) => (
          <li key={c.id} className="card flex flex-col p-5">
            <Award className="h-7 w-7 text-accent" /><p className="mt-3 font-semibold">{c.courseTitle}</p>
            <p className="text-xs text-muted">Issued {formatDate(c.issuedAt)} · {c.number}</p>
            <div className="mt-2"><StatusBadge status={c.status} /></div>
            <div className="mt-4 flex gap-2"><ButtonLink size="sm" href={`/certificates/${c.id}`}>View</ButtonLink><a className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-sm hover:bg-surface-2" href={`/certificates-pdf/${c.id}`}>PDF</a></div>
          </li>))}</ul>
      ) : <EmptyState className="mt-8" icon={Award} title="No certificates yet" description="Complete all lessons of an eligible course and pass its final assessment." action={<ButtonLink href="/academy/courses?certificate=yes">Find certificate courses</ButtonLink>} />}
      <p className="mt-8 text-sm"><Link href="/certificates/verify" className="text-brand underline">Verify a certificate</Link></p>
    </div>
  );
}
