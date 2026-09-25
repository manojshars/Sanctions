import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";
import { getCurrentUser } from "@/lib/auth/session";
import { AcceptInvite } from "@/components/corporate/corporate-forms";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Join organisation", robots: { index: false } };

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const inv = token ? await db.orgInvitation.findUnique({ where: { tokenHash: hashToken(token) }, include: { org: true } }) : null;
  const valid = inv && !inv.acceptedAt && inv.expiresAt > new Date();
  const user = await getCurrentUser();
  return (
    <div className="container max-w-lg py-16">
      <div className="card p-8 text-center">
        <Building2 className="mx-auto h-10 w-10 text-accent" />
        {valid ? (
          <>
            <h1 className="mt-4 text-2xl font-bold">Join {inv.org.name}</h1>
            <p className="mt-2 text-muted">You&apos;ve been invited to join this organisation&apos;s training programme on FinCrime Academy.</p>
            <div className="mt-6">{user ? <AcceptInvite token={token} /> : <div className="flex justify-center gap-2"><ButtonLink href={`/register?next=${encodeURIComponent(`/corporate/join?token=${token}`)}`}>Create account</ButtonLink><ButtonLink href={`/login?next=${encodeURIComponent(`/corporate/join?token=${token}`)}`} variant="secondary">Sign in</ButtonLink></div>}</div>
            <p className="mt-4 text-xs text-muted">Invitation for {inv.email}</p>
          </>
        ) : <><h1 className="mt-4 text-2xl font-bold">Invitation not valid</h1><p className="mt-2 text-muted">This invitation link is invalid, already used, or expired. Ask your manager to send a new one.</p></>}
      </div>
    </div>
  );
}
