"use client";
import { startAssessmentAction, startPracticeAction } from "@/server/actions/attempts";
import { useFormAction } from "@/components/forms/use-action";
import { SubmitButton } from "@/components/forms/submit-button";
import { Alert } from "@/components/ui/feedback";
import type { ButtonProps } from "@/components/ui/button";

/** Small one-click form that starts a practice session with hidden fields. */
export function QuickStart({ fields, label, variant = "primary", size = "md", className }: {
  fields: Record<string, string | undefined>; label: React.ReactNode; variant?: ButtonProps["variant"]; size?: ButtonProps["size"]; className?: string;
}) {
  const [state, action] = useFormAction(startPracticeAction);
  return (
    <form action={action} className={className}>
      {Object.entries(fields).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <SubmitButton variant={variant} size={size} pendingText="Starting…">{label}</SubmitButton>
      {state.error && <Alert tone="warning" className="mt-2">{state.error}</Alert>}
    </form>
  );
}

export function AssessmentStart({ slug, label = "Start", variant = "primary", size = "md", className, children }: {
  slug: string; label?: React.ReactNode; variant?: ButtonProps["variant"]; size?: ButtonProps["size"]; className?: string; children?: React.ReactNode;
}) {
  const [state, action] = useFormAction(startAssessmentAction);
  return (
    <form action={action} className={className}>
      <input type="hidden" name="slug" value={slug} />
      {children}
      <SubmitButton variant={variant} size={size} pendingText="Preparing…">{label}</SubmitButton>
      {state.error && <Alert tone="warning" className="mt-3">{state.error}</Alert>}
    </form>
  );
}
