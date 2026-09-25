"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireActionUser, getCurrentUser } from "@/lib/auth/session";
import { AccessError, NotFoundError } from "@/server/services/courses";
import { acceptInvitation, assignCourse, createOrganization, inviteMember, removeMember } from "@/server/services/corporate";
import type { ActionState } from "@/server/action-types";

function fail(e: unknown): ActionState {
  if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "Invalid input" };
  if (e instanceof AccessError || e instanceof NotFoundError) return { error: e.message };
  throw e;
}

export async function createOrgAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireActionUser();
  let id: string;
  try { id = (await createOrganization(user.id, { name: String(form.get("name") ?? ""), industry: String(form.get("industry") ?? "") || undefined })).id; } catch (e) { return fail(e); }
  redirect(`/corporate/dashboard?org=${id}`);
}

export async function inviteAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireActionUser();
  const orgId = String(form.get("orgId"));
  const emails = String(form.get("emails") ?? "").split(/[\s,;]+/).filter(Boolean).slice(0, 100);
  if (!emails.length) return { error: "Enter at least one email address." };
  let sent = 0;
  const errors: string[] = [];
  for (const email of emails) {
    try { await inviteMember(user.id, orgId, email, form.get("role") === "MANAGER" ? "MANAGER" : "MEMBER"); sent++; } catch (e) { errors.push(`${email}: ${fail(e).error}`); }
  }
  revalidatePath("/corporate/dashboard");
  return errors.length ? { error: `${sent} invitation(s) sent. ${errors.join("; ")}` } : { ok: true, message: `${sent} invitation(s) sent.` };
}

export async function assignAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireActionUser();
  const orgId = String(form.get("orgId"));
  try {
    const n = await assignCourse(user.id, orgId, { courseId: String(form.get("courseId") ?? ""), userIds: form.getAll("userIds").map(String), dueDate: form.get("dueDate") ? new Date(String(form.get("dueDate"))) : null });
    revalidatePath("/corporate/dashboard");
    return { ok: true, message: `Course assigned to ${n} learner(s).` };
  } catch (e) { return fail(e); }
}

export async function removeMemberAction(orgId: string, userId: string): Promise<ActionState> {
  const user = await requireActionUser();
  try { await removeMember(user.id, orgId, userId); } catch (e) { return fail(e); }
  revalidatePath("/corporate/dashboard");
  return { ok: true };
}

export async function acceptInviteAction(token: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/corporate/join?token=${token}`)}`);
  try { await acceptInvitation(user.id, token); } catch (e) { return fail(e); }
  redirect("/my-learning?tab=plan");
}
