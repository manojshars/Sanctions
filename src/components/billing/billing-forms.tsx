"use client";
import { useActionRedirect } from "@/components/forms/use-action";
import { useActionState, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { checkoutAction, previewCouponAction, confirmDevPaymentAction, cancelMembershipAction, feeAssistanceAction } from "@/server/actions/billing";
import { useFormAction } from "@/components/forms/use-action";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/server/action-types";

export function CheckoutForm({ kind, slug, label = "Continue to secure checkout" }: { kind: string; slug: string; label?: string }) {
  const [state, action] = useFormAction(checkoutAction);
  const [preview, previewAction] = useFormAction(previewCouponAction);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="slug" value={slug} />
      <div className="flex gap-2">
        <label htmlFor="coupon" className="sr-only">Coupon code</label>
        <Input id="coupon" name="coupon" placeholder="Coupon code (optional)" className="uppercase" />
        <Button type="submit" variant="secondary" formAction={previewAction} formNoValidate>Apply</Button>
      </div>
      {preview.error && <Alert tone="danger">{preview.error}</Alert>}
      {preview.ok && <Alert tone="success">{preview.message}</Alert>}
      <SubmitButton variant="gold" size="lg" className="w-full" pendingText="Redirecting…">{label}</SubmitButton>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
    </form>
  );
}

export function DevConfirm({ paymentId }: { paymentId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(confirmDevPaymentAction.bind(null, paymentId), {});
  useActionRedirect(state);
  return (
    <form action={action}>
      {state.error && <Alert tone="danger" className="mb-3">{state.error}</Alert>}
      <SubmitButton variant="gold" size="lg" pendingText="Confirming…">Simulate successful payment</SubmitButton>
    </form>
  );
}

export function CancelMembership({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  if (msg) return <p className="text-sm text-success">{msg}</p>;
  return confirm ? (
    <div className="flex items-center gap-2 text-sm"><span>Cancel renewal?</span>
      <Button size="sm" variant="danger" disabled={pending} onClick={() => start(async () => { const r = await cancelMembershipAction(id); setMsg(r.message ?? r.error ?? null); router.refresh(); })}>Yes, cancel</Button>
      <Button size="sm" variant="secondary" onClick={() => setConfirm(false)}>Keep</Button></div>
  ) : <Button size="sm" variant="secondary" onClick={() => setConfirm(true)}>Cancel subscription</Button>;
}

export function FeeAssistanceForm() {
  const [state, action] = useFormAction(feeAssistanceAction);
  if (state.ok) return <Alert tone="success">{state.message}</Alert>;
  return (
    <form action={action} className="space-y-3">
      <div><label className="label" htmlFor="fa-country">Country (optional)</label><Input id="fa-country" name="country" maxLength={80} /></div>
      <div><label className="label" htmlFor="fa-reason">Tell us about your circumstances and learning goals</label><Textarea id="fa-reason" name="reason" required maxLength={3000} /></div>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <SubmitButton variant="secondary" pendingText="Submitting…">Apply for fee assistance</SubmitButton>
    </form>
  );
}
