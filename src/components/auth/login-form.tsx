"use client";
import Link from "next/link";
import { loginAction } from "@/server/actions/auth";
import { useFormAction } from "@/components/forms/use-action";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useFormAction(loginAction);
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="flex justify-end text-sm">
        <Link href="/forgot-password" className="font-medium text-brand hover:underline">Forgot password?</Link>
      </div>
      <SubmitButton className="w-full" size="lg" pendingText="Signing in…">Sign in</SubmitButton>
      <p className="text-center text-sm text-muted">New to FinCrime Academy? <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand hover:underline">Create a free account</Link></p>
    </form>
  );
}
