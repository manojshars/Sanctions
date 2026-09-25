"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { getCurrentUser, requireActionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { UploadError } from "@/lib/storage";
import { AccessError, NotFoundError } from "@/server/services/courses";
import { closeOwnTicket, createTicket, replyToTicket, updateTicket, type Upload } from "@/server/services/support";
import type { ActionState } from "@/server/action-types";
import { redirectOrReturn } from "@/server/action-redirect";

async function files(form: FormData): Promise<Upload[]> {
  const out: Upload[] = [];
  for (const v of form.getAll("attachments")) {
    if (v instanceof File && v.size > 0) out.push({ name: v.name, type: v.type, bytes: new Uint8Array(await v.arrayBuffer()) });
  }
  return out;
}

function fail(e: unknown): ActionState {
  if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "Invalid input", fieldErrors: e.flatten().fieldErrors as Record<string, string[]> };
  if (e instanceof UploadError || e instanceof AccessError || e instanceof NotFoundError) return { error: e.message };
  throw e;
}

export async function createTicketAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/support/new");
  if (!rateLimit(`ticket:${user.id}`, 10, 60 * 60_000).ok) return { error: "You have opened many tickets recently. Please wait before opening another." };
  let n: number;
  try {
    n = (await createTicket(user, { category: String(form.get("category")) as never, subject: String(form.get("subject") ?? ""), body: String(form.get("body") ?? "") }, await files(form))).number;
  } catch (e) {
    return fail(e);
  }
  return redirectOrReturn(`/support/tickets/${n}?created=1`);
}

export async function replyTicketAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireActionUser();
  const number = Number(form.get("number"));
  try {
    await replyToTicket(user, number, String(form.get("body") ?? ""), { internal: form.get("internal") === "on", files: await files(form) });
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/support/tickets/${number}`);
  revalidatePath(`/admin/support/${number}`);
  return { ok: true, message: "Reply sent." };
}

export async function updateTicketAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireActionUser();
  const number = Number(form.get("number"));
  try {
    await updateTicket(user, number, {
      status: (form.get("status") as never) || undefined,
      priority: (form.get("priority") as never) || undefined,
      assigneeId: form.has("assigneeId") ? (String(form.get("assigneeId")) || null) : undefined,
    });
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/admin/support/${number}`);
  return { ok: true, message: "Ticket updated." };
}

export async function closeTicketAction(number: number): Promise<ActionState> {
  const user = await requireActionUser();
  try { await closeOwnTicket(user, number); } catch (e) { return fail(e); }
  return { ok: true };
}

export async function helpFeedbackAction(articleId: string, helpful: boolean) {
  const user = await getCurrentUser();
  await db.helpArticleFeedback.create({ data: { articleId, helpful, userId: user?.id ?? null } });
  return { ok: true };
}
