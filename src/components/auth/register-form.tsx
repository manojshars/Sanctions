"use client";
import Link from "next/link";
import { registerAction } from "@/server/actions/auth";
import { useFormAction } from "@/components/forms/use-action";
import { SubmitButton } from "@/components/forms/submit-button";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";

export function RegisterForm({ topics, next }: { topics: { slug: string; name: string }[]; next?: string }) {
  const [state, action] = useFormAction(registerAction);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Full name" htmlFor="name" error={fe.name} required>
        <Input id="name" name="name" autoComplete="name" required aria-invalid={!!fe.name} />
      </Field>
      <Field label="Email" htmlFor="email" error={fe.email} required>
        <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!fe.email} />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 10 characters, including a letter and a number." error={fe.password} required>
        <Input id="password" name="password" type="password" autoComplete="new-password" required aria-invalid={!!fe.password} aria-describedby="password-hint" />
      </Field>
      <Field label="Your experience level" htmlFor="level">
        <Select id="level" name="level" defaultValue="BEGINNER">
          <option value="BEGINNER">Beginner — new to financial crime</option>
          <option value="INTERMEDIATE">Intermediate — some practical experience</option>
          <option value="ADVANCED">Advanced — experienced practitioner</option>
        </Select>
      </Field>
      <fieldset>
        <legend className="label">Interests <span className="font-normal text-muted">(used for recommendations)</span></legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {topics.map((t) => (
            <Checkbox key={t.slug} name="interests" value={t.slug} label={t.name} />
          ))}
        </div>
      </fieldset>
      <div className="space-y-2.5 rounded-xl border border-line bg-surface-2 p-4">
        <Checkbox name="acceptTerms" required label={<>I agree to the <Link href="/terms" className="text-brand underline">Terms</Link> and <Link href="/privacy" className="text-brand underline">Privacy Policy</Link>.</>} />
        {fe.acceptTerms && <p role="alert" className="text-xs font-medium text-danger">{fe.acceptTerms[0]}</p>}
        <Checkbox name="marketingOptIn" label="Send me occasional product and learning updates (optional)." />
      </div>
      <SubmitButton className="w-full" size="lg" pendingText="Creating account…">Create account</SubmitButton>
      <p className="text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-brand hover:underline">Sign in</Link></p>
    </form>
  );
}
