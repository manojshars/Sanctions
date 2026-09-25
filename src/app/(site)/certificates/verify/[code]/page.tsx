import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { currentIp } from "@/lib/auth/session";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Certificate verification", robots: { index: false } };

export default async function VerifyCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const limited = !rateLimit(`verify:${(await currentIp()) ?? "x"}`, 60, 60_000).ok;
  const cert = limited ? null : await db.certificate.findUnique({ where: { verificationCode: decodeURIComponent(code).toUpperCase() } });
  const valid = cert && cert.status === "VALID";
  return (
    <div className="container max-w-2xl py-16">
      {limited ? <p className="text-muted">Too many lookups. Please try again shortly.</p> : valid ? (
        <div className="card p-8">
          <p className="flex items-center gap-2 text-lg font-bold text-success"><CheckCircle2 className="h-6 w-6" /> Valid certificate</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-muted">Learner</dt><dd className="font-semibold">{cert.learnerName}</dd></div>
            <div><dt className="text-xs text-muted">Course</dt><dd className="font-semibold">{cert.courseTitle}</dd></div>
            <div><dt className="text-xs text-muted">Issue date</dt><dd className="font-semibold">{formatDate(cert.issuedAt)}</dd></div>
            <div><dt className="text-xs text-muted">Certificate number</dt><dd className="font-semibold">{cert.number}</dd></div>
            <div><dt className="text-xs text-muted">Issuing organisation</dt><dd className="font-semibold">FinCrime Academy</dd></div>
          </dl>
          <p className="mt-6 text-xs text-muted">This is an internal completion certificate issued by FinCrime Academy. It is not an external accredited qualification.</p>
        </div>
      ) : (
        <div className="card p-8">
          <p className="flex items-center gap-2 text-lg font-bold text-danger"><XCircle className="h-6 w-6" /> {cert ? "Certificate revoked" : "No certificate found"}</p>
          <p className="mt-2 text-muted">{cert ? "This certificate is no longer valid." : "Check the code and try again."}</p>
          <ButtonLink href="/certificates/verify" variant="secondary" className="mt-6">Try another code</ButtonLink>
        </div>
      )}
    </div>
  );
}
