import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { verifyEmailToken } from "@/server/services/auth";

export const metadata: Metadata = { title: "Verify email", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const ok = token ? await verifyEmailToken(token) : false;
  return (
    <AuthShell title="Email verification">
      {ok ? <Alert tone="success" title="Email verified">Thank you — your email address has been confirmed.</Alert> : <Alert tone="danger" title="Link invalid or expired">Request a new verification email from Account settings.</Alert>}
      <ButtonLink href="/dashboard" className="mt-6">Go to dashboard</ButtonLink>
    </AuthShell>
  );
}
