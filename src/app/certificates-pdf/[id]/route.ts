import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/rbac";
import { renderCertificatePdf } from "@/lib/certificate-pdf";
import { appUrl } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const cert = await db.certificate.findUnique({ where: { id } });
  if (!cert || (cert.userId !== user.id && !isStaff(user.role))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (cert.status !== "VALID") return NextResponse.json({ error: "This certificate has been revoked." }, { status: 410 });
  const bytes = await renderCertificatePdf({ ...cert, verificationUrl: appUrl(`/certificates/verify/${cert.verificationCode}`) });
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="FinCrime-Academy-Certificate-${cert.number}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
