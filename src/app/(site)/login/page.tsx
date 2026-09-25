import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthAside, AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/session";
import { Alert } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect(sp.next?.startsWith("/") ? sp.next : "/dashboard");
  return (
    <AuthShell title="Welcome back" description="Sign in to continue your learning." aside={<AuthAside />}>
      {sp.reset && <Alert tone="success" className="mb-5">Your password has been reset. Please sign in.</Alert>}
      <LoginForm next={sp.next} />
    </AuthShell>
  );
}
