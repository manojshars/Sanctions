"use client";
import { updateProfileAction, changePasswordAction, deleteAccountAction, resendVerificationAction } from "@/server/actions/account";
import { useFormAction } from "@/components/forms/use-action";
import { SubmitButton } from "@/components/forms/submit-button";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { useActionState } from "react";
import type { ActionState } from "@/server/action-types";

export function ProfileForm({ user, topics }: { user: { name: string; headline: string | null; level: string; interests: string[]; marketingOptIn: boolean; email: string }; topics: { slug: string; name: string }[] }) {
  const [state, action] = useFormAction(updateProfileAction);
  return (
    <form action={action} className="space-y-5">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}
      <Field label="Full name" htmlFor="name" error={state.fieldErrors?.name}><Input id="name" name="name" defaultValue={user.name} required maxLength={100} /></Field>
      <Field label="Email" htmlFor="email" hint="Contact support to change your email address."><Input id="email" value={user.email} disabled readOnly /></Field>
      <Field label="Professional headline" htmlFor="headline"><Input id="headline" name="headline" defaultValue={user.headline ?? ""} maxLength={160} placeholder="e.g. Sanctions Analyst" /></Field>
      <Field label="Experience level" htmlFor="level"><Select id="level" name="level" defaultValue={user.level}><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></Select></Field>
      <fieldset><legend className="label">Learning interests</legend><div className="grid gap-2 sm:grid-cols-2">{topics.map((t) => <Checkbox key={t.slug} name="interests" value={t.slug} defaultChecked={user.interests.includes(t.slug)} label={t.name} />)}</div></fieldset>
      <Checkbox name="marketingOptIn" defaultChecked={user.marketingOptIn} label="Receive occasional product and learning updates by email" />
      <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useFormAction(changePasswordAction);
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}
      <Field label="Current password" htmlFor="current"><Input id="current" name="current" type="password" autoComplete="current-password" required /></Field>
      <Field label="New password" htmlFor="next" hint="At least 10 characters, including a letter and a number."><Input id="next" name="next" type="password" autoComplete="new-password" required /></Field>
      <Field label="Confirm new password" htmlFor="confirm"><Input id="confirm" name="confirm" type="password" autoComplete="new-password" required /></Field>
      <SubmitButton pendingText="Saving…">Change password</SubmitButton>
    </form>
  );
}

export function ResendVerification() {
  const [state, action] = useActionState<ActionState>(async () => resendVerificationAction(), {});
  return (
    <form action={action} className="flex items-center gap-3">
      <SubmitButton size="sm" variant="secondary" pendingText="Sending…">Resend verification email</SubmitButton>
      {state.message && <span className="text-sm text-success">{state.message}</span>}
      {state.error && <span className="text-sm text-danger">{state.error}</span>}
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useFormAction(deleteAccountAction);
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Field label="Password" htmlFor="del-password"><Input id="del-password" name="password" type="password" autoComplete="current-password" required /></Field>
      <Field label='Type "DELETE" to confirm' htmlFor="del-confirm"><Input id="del-confirm" name="confirm" required autoComplete="off" /></Field>
      <SubmitButton variant="danger" pendingText="Deleting…">Permanently delete my account</SubmitButton>
    </form>
  );
}
