import type { Metadata } from "next";
import { AuthAside, AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" description="Enter your email and we'll send you a secure reset link." aside={<AuthAside />}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
