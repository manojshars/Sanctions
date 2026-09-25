"use client";
import { useRef, useTransition } from "react";
import { createTicketAction, replyTicketAction, updateTicketAction, closeTicketAction, helpFeedbackAction } from "@/server/actions/support";
import { useFormAction } from "@/components/forms/use-action";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

export function NewTicketForm({ categories, defaultCategory }: { categories: readonly string[]; defaultCategory?: string }) {
  const [state, action] = useFormAction(createTicketAction);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" encType="multipart/form-data">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Field label="Category" htmlFor="category" required>
        <Select id="category" name="category" defaultValue={defaultCategory ?? categories[0]}>{categories.map((c) => <option key={c}>{c}</option>)}</Select>
      </Field>
      <Field label="Subject" htmlFor="subject" error={fe.subject} required><Input id="subject" name="subject" maxLength={160} required /></Field>
      <Field label="Describe the issue" htmlFor="body" error={fe.body} hint="Include what you were doing, what you expected and what happened." required><Textarea id="body" name="body" maxLength={10000} required className="min-h-[160px]" /></Field>
      <Field label="Attachments (optional)" htmlFor="attachments" hint="Up to 3 files · PNG, JPG, PDF or TXT · 5 MB each"><input id="attachments" name="attachments" type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.txt,image/png,image/jpeg,application/pdf,text/plain" className="block text-sm" /></Field>
      <SubmitButton size="lg" pendingText="Submitting…">Submit ticket</SubmitButton>
    </form>
  );
}

export function ReplyForm({ number, staff }: { number: number; staff?: boolean }) {
  const [state, action] = useFormAction(replyTicketAction);
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={async (f) => { await action(f); ref.current?.reset(); }} className="space-y-3">
      <input type="hidden" name="number" value={number} />
      <label htmlFor="reply" className="label">{staff ? "Reply or internal note" : "Your reply"}</label>
      <Textarea id="reply" name="body" required maxLength={10000} />
      <input name="attachments" type="file" multiple aria-label="Attachments" accept=".png,.jpg,.jpeg,.pdf,.txt" className="block text-sm" />
      {staff && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="internal" className="accent-[#D6B66B]" /> Internal note (not visible to the user)</label>}
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}
      <SubmitButton pendingText="Sending…">Send</SubmitButton>
    </form>
  );
}

export function TicketAdminForm({ number, status, priority, assigneeId, staff }: { number: number; status: string; priority: string; assigneeId: string | null; staff: { id: string; name: string }[] }) {
  const [state, action] = useFormAction(updateTicketAction);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="number" value={number} />
      <div><label className="label" htmlFor="t-status">Status</label><Select id="t-status" name="status" defaultValue={status}>{["OPEN", "IN_PROGRESS", "AWAITING_USER", "RESOLVED", "CLOSED"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</Select></div>
      <div><label className="label" htmlFor="t-priority">Priority</label><Select id="t-priority" name="priority" defaultValue={priority}>{["LOW", "NORMAL", "HIGH", "URGENT"].map((s) => <option key={s}>{s}</option>)}</Select></div>
      <div><label className="label" htmlFor="t-assignee">Assignee</label><Select id="t-assignee" name="assigneeId" defaultValue={assigneeId ?? ""}><option value="">Unassigned</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}
      <SubmitButton pendingText="Saving…">Update ticket</SubmitButton>
    </form>
  );
}

export function CloseTicketButton({ number }: { number: number }) {
  const [pending, start] = useTransition();
  return <Button variant="secondary" size="sm" disabled={pending} onClick={() => start(async () => { await closeTicketAction(number); })}>Close ticket</Button>;
}

export function HelpFeedback({ articleId }: { articleId: string }) {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  if (done) return <p className="text-sm text-success">Thanks for your feedback.</p>;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted">Was this article helpful?</span>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => start(async () => { await helpFeedbackAction(articleId, true); setDone(true); })}><ThumbsUp className="h-4 w-4" /> Yes</Button>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => start(async () => { await helpFeedbackAction(articleId, false); setDone(true); })}><ThumbsDown className="h-4 w-4" /> No</Button>
    </div>
  );
}
