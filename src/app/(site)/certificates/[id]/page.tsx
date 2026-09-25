import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download, Share2, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isStaff } from "@/lib/rbac";
import { CertificateView } from "@/components/certificates/certificate-view";
import { Alert } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { appUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Certificate", robots: { index: false } };

export default async function CertificatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/certificates/${id}`);
  const cert = await db.certificate.findUnique({ where: { id } });
  if (!cert || (cert.userId !== user.id && !isStaff(user.role))) notFound();
  const verifyUrl = appUrl(`/certificates/verify/${cert.verificationCode}`);
  const issued = cert.issuedAt;
  const linkedIn = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.courseTitle)}&organizationName=${encodeURIComponent("FinCrime Academy")}&issueYear=${issued.getFullYear()}&issueMonth=${issued.getMonth() + 1}&certId=${encodeURIComponent(cert.number)}&certUrl=${encodeURIComponent(verifyUrl)}`;
  return (
    <div className="container max-w-4xl py-10">
      {sp.new && <Alert tone="success" title="Congratulations!" className="mb-6">You have completed {cert.courseTitle}. Your certificate has been issued.</Alert>}
      {cert.status === "REVOKED" && <Alert tone="danger" className="mb-6">This certificate has been revoked.</Alert>}
      <CertificateView c={cert} verifyUrl={verifyUrl} />
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={`/certificates-pdf/${cert.id}`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-navy px-4 text-sm font-medium text-white hover:bg-navy-600 dark:bg-gold-400 dark:text-navy"><Download className="h-4 w-4" /> Download PDF</a>
        <a href={linkedIn} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium hover:bg-surface-2"><Share2 className="h-4 w-4" /> Add to LinkedIn</a>
        <ButtonLink href={`/certificates/verify/${cert.verificationCode}`} variant="ghost"><ShieldCheck className="h-4 w-4" /> Public verification page</ButtonLink>
      </div>
    </div>
  );
}
