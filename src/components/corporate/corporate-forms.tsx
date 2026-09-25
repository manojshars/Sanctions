"use client";
import { useActionRedirect } from "@/components/forms/use-action";
import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInviteAction, assignAction, createOrgAction, inviteAction, removeMemberAction } from "@/server/actions/corporate";
import { submitInquiryAction } from "@/server/actions/public";
import { useFormAction } from "@/components/forms/use-action";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/server/action-types";

export function InquiryForm({ type = "CORPORATE", defaults }: { type?: "CORPORATE" | "WORKSHOP" | "CONTACT"; defaults?: { name?: string; email?: string; company?: string } }) {
  const [state, action] = useFormAction(submitInquiryAction);
  if (state.ok) return <Alert tone="success" title="Message received">{state.message}</Alert>;
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="type" value={type} />
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor={`iq-name-${type}`} error={fe.name} required><Input id={`iq-name-${type}`} name="name" defaultValue={defaults?.name} required /></Field>
        <Field label="Work email" htmlFor={`iq-email-${type}`} error={fe.email} required><Input id={`iq-email-${type}`} name="email" type="email" defaultValue={defaults?.email} required /></Field>
      </div>
      {type !== "CONTACT" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Organisation" htmlFor={`iq-co-${type}`}><Input id={`iq-co-${type}`} name="company" defaultValue={defaults?.company} /></Field>
          <Field label="Team size" htmlFor={`iq-size-${type}`}><Select id={`iq-size-${type}`} name="teamSize" defaultValue=""><option value="">Select</option><option>1–10</option><option>11–50</option><option>51–250</option><option>251–1000</option><option>1000+</option></Select></Field>
        </div>
      ) : <Field label="Subject" htmlFor="iq-subject"><Input id="iq-subject" name="subject" maxLength={160} /></Field>}
      <Field label={type === "WORKSHOP" ? "Workshop requirements (topics, audience, format, timing)" : "Message"} htmlFor={`iq-msg-${type}`} error={fe.message} required><Textarea id={`iq-msg-${type}`} name="message" required maxLength={5000} /></Field>
      <p className="text-xs text-muted">We use these details only to respond to your enquiry. See our <a href="/privacy" className="underline">Privacy Policy</a>.</p>
      <SubmitButton pendingText="Sending…">{type === "WORKSHOP" ? "Request workshop" : "Send message"}</SubmitButton>
    </form>
  );
}

export function CreateOrgForm() {
  const [state, action] = useFormAction(createOrgAction);
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Field label="Organisation name" htmlFor="org-name" required><Input id="org-name" name="name" required maxLength={120} /></Field>
      <Field label="Industry" htmlFor="org-ind"><Input id="org-ind" name="industry" maxLength={80} /></Field>
      <SubmitButton pendingText="Creating…">Create organisation</SubmitButton>
    </form>
  );
}

export function InviteForm({ orgId }: { orgId: string }) {
  const [state, action] = useFormAction(inviteAction);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orgId" value={orgId} />
      <Field label="Email addresses" htmlFor="inv-emails" hint="Separate multiple emails with commas or new lines."><Textarea id="inv-emails" name="emails" required className="min-h-[80px]" /></Field>
      <Field label="Role" htmlFor="inv-role"><Select id="inv-role" name="role" defaultValue="MEMBER"><option value="MEMBER">Learner</option><option value="MANAGER">Manager</option></Select></Field>
      {state.error && <Alert tone="warning">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}
      <SubmitButton pendingText="Sending…">Send invitations</SubmitButton>
    </form>
  );
}

export function AssignForm({ orgId, courses, members }: { orgId: string; courses: { id: string; title: string }[]; members: { userId: string; name: string }[] }) {
  const [state, action] = useFormAction(assignAction);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orgId" value={orgId} />
      <Field label="Course" htmlFor="as-course"><Select id="as-course" name="courseId" required>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select></Field>
      <Field label="Deadline (optional)" htmlFor="as-due"><Input id="as-due" name="dueDate" type="date" /></Field>
      <fieldset><legend className="label">Learners</legend>
        <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-line p-3 text-sm">{members.map((m) => <label key={m.userId} className="flex items-center gap-2"><input type="checkbox" name="userIds" value={m.userId} className="accent-[#193B68]" />{m.name}</label>)}</div>
      </fieldset>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}
      <SubmitButton pendingText="Assigning…">Assign course</SubmitButton>
    </form>
  );
}

export function RemoveMemberButton({ orgId, userId }: { orgId: string; userId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return <Button size="sm" variant="ghost" disabled={pending} onClick={() => { if (confirm("Remove this member and their assignments?")) start(async () => { await removeMemberAction(orgId, userId); router.refresh(); }); }}>Remove</Button>;
}

export function AcceptInvite({ token }: { token: string }) {
  const [state, action] = useActionState<ActionState, FormData>(acceptInviteAction.bind(null, token), {});
  useActionRedirect(state);
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <SubmitButton variant="gold" size="lg" pendingText="Joining…">Accept invitation</SubmitButton>
    </form>
  );
}
