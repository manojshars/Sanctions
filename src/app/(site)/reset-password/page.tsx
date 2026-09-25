import type { Metadata } from "next";
import { AuthAside, AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/password-forms";
import { Alert } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Choose a new password" aside={<AuthAside />}>
      {token ? <ResetPasswordForm token={token} /> : <Alert tone="danger">This reset link is missing its token. Request a new link.</Alert>}
    </AuthShell>
  );
}
