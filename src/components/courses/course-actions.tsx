"use client";
import { useActionState } from "react";
import { enrollAction, startFinalAssessmentAction } from "@/server/actions/learning";
import { SubmitButton } from "@/components/forms/submit-button";
import { Alert } from "@/components/ui/feedback";
import type { ActionState } from "@/server/action-types";

export function EnrollButton({ courseId, label = "Enrol in this course" }: { courseId: string; label?: string }) {
  const [state, action] = useActionState<ActionState>(async () => enrollAction(courseId), {});
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <SubmitButton size="lg" variant="gold" className="w-full" pendingText="Enrolling…">{label}</SubmitButton>
    </form>
  );
}

export function StartFinalButton({ courseId, disabled, label = "Start final assessment" }: { courseId: string; disabled?: boolean; label?: string }) {
  const [state, action] = useActionState<ActionState>(async () => startFinalAssessmentAction(courseId), {});
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <SubmitButton className="w-full" disabled={disabled} pendingText="Preparing…">{label}</SubmitButton>
    </form>
  );
}
