import { z } from "zod";
import type { TicketPriority, TicketStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { can, type Role } from "@/lib/rbac";
import { notify, sendEmail } from "@/lib/email";
import { putObject, validateUpload } from "@/lib/storage";
import { AccessError, NotFoundError } from "./courses";
import { audit } from "@/lib/audit";

type Actor = { id: string; role: Role; email?: string; name?: string };

export const TICKET_CATEGORIES = [
  "Getting Started", "Login and Account", "Course Enrollment", "Question Bank", "Flashcards",
  "Certificates and Assessments", "Payments and Membership", "Technical Troubleshooting", "Content Feedback", "Other",
] as const;

export const ticketSchema = z.object({
  category: z.enum(TICKET_CATEGORIES),
  subject: z.string().trim().min(5, "Subject must be at least 5 characters.").max(160),
  body: z.string().trim().min(10, "Please describe the issue (10+ characters).").max(10000),
});

export type Upload = { name: string; type: string; bytes: Uint8Array };

async function saveAttachments(messageId: string, files: Upload[]) {
  if (files.length > 3) throw new AccessError("You can attach up to 3 files.");
  const validated = files.map((f) => ({ f, v: validateUpload(f.name, f.type, f.bytes) }));
  for (const { f, v } of validated) {
    const storageKey = await putObject(f.bytes, v.ext);
    await db.supportAttachment.create({ data: { messageId, filename: v.safeName, mimeType: f.type, size: f.bytes.byteLength, storageKey } });
  }
}

export async function createTicket(user: Actor, input: z.infer<typeof ticketSchema>, files: Upload[] = []) {
  const data = ticketSchema.parse(input);
  files.forEach((f) => validateUpload(f.name, f.type, f.bytes)); // validate before writing anything
  const ticket = await db.supportTicket.create({
    data: { userId: user.id, subject: data.subject, category: data.category, messages: { create: { authorId: user.id, body: data.body } } },
    include: { messages: true },
  });
  if (files.length) await saveAttachments(ticket.messages[0].id, files);
  await notify(user.id, `Ticket #${ticket.number} received`, `We've received your request: ${ticket.subject}`, `/support/tickets/${ticket.number}`);
  if (user.email) await sendEmail(user.email, `[FinCrime Academy] Ticket #${ticket.number} received`, `We've received your support request "${ticket.subject}". You can track it in the Support Center.`);
  return ticket;
}

export function isSupportStaff(role: Role) {
  return can(role, "support:manage");
}

export async function getTicket(actor: Actor, number: number) {
  const staff = isSupportStaff(actor.role);
  const ticket = await db.supportTicket.findUnique({
    where: { number },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true } },
      messages: { where: staff ? {} : { isInternal: false }, orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, name: true, role: true } }, attachments: true } },
    },
  });
  if (!ticket) throw new NotFoundError("Ticket not found");
  if (!staff && ticket.userId !== actor.id) throw new NotFoundError("Ticket not found"); // do not reveal existence
  return ticket;
}

export async function replyToTicket(actor: Actor, number: number, body: string, opts: { internal?: boolean; files?: Upload[] } = {}) {
  const text = z.string().trim().min(1, "Message cannot be empty.").max(10000).parse(body);
  const ticket = await getTicket(actor, number);
  const staff = isSupportStaff(actor.role);
  const internal = !!opts.internal && staff;
  if (ticket.status === "CLOSED" && !staff) throw new AccessError("This ticket is closed. Please open a new ticket.");
  (opts.files ?? []).forEach((f) => validateUpload(f.name, f.type, f.bytes));
  const msg = await db.supportMessage.create({ data: { ticketId: ticket.id, authorId: actor.id, body: text, isInternal: internal } });
  if (opts.files?.length) await saveAttachments(msg.id, opts.files);
  if (internal) return msg;
  const isRequester = actor.id === ticket.userId;
  const data: { status?: TicketStatus; firstResponseAt?: Date } = {};
  if (isRequester) {
    if (ticket.status === "AWAITING_USER" || ticket.status === "RESOLVED") data.status = "OPEN";
  } else {
    if (!ticket.firstResponseAt) data.firstResponseAt = new Date();
    if (ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") data.status = "AWAITING_USER";
    await notify(ticket.userId, `New reply on ticket #${ticket.number}`, ticket.subject, `/support/tickets/${ticket.number}`);
    await sendEmail(ticket.user.email, `[FinCrime Academy] Reply on ticket #${ticket.number}`, `Our support team replied to "${ticket.subject}". View it in the Support Center.`);
  }
  if (Object.keys(data).length) await db.supportTicket.update({ where: { id: ticket.id }, data });
  return msg;
}

export const ticketUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "AWAITING_USER", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
});

export async function updateTicket(actor: Actor, number: number, input: z.infer<typeof ticketUpdateSchema>) {
  if (!isSupportStaff(actor.role)) throw new AccessError("Support staff only.");
  const data = ticketUpdateSchema.parse(input);
  const ticket = await db.supportTicket.findUnique({ where: { number } });
  if (!ticket) throw new NotFoundError("Ticket not found");
  if (data.assigneeId) {
    const a = await db.user.findUnique({ where: { id: data.assigneeId } });
    if (!a || !isSupportStaff(a.role)) throw new AccessError("Tickets can only be assigned to support staff.");
  }
  const now = new Date();
  const updated = await db.supportTicket.update({
    where: { id: ticket.id },
    data: {
      ...(data.status ? { status: data.status as TicketStatus } : {}),
      ...(data.priority ? { priority: data.priority as TicketPriority } : {}),
      ...(data.assigneeId !== undefined ? { assigneeId: data.assigneeId } : {}),
      ...(data.status === "RESOLVED" && !ticket.resolvedAt ? { resolvedAt: now } : {}),
      ...(data.status === "CLOSED" ? { closedAt: now, resolvedAt: ticket.resolvedAt ?? now } : {}),
    },
  });
  if (data.status && data.status !== ticket.status) {
    await notify(ticket.userId, `Ticket #${ticket.number} is now ${data.status.toLowerCase().replace("_", " ")}`, ticket.subject, `/support/tickets/${ticket.number}`);
  }
  await audit(actor.id, "ticket.update", "SupportTicket", ticket.id, data);
  return updated;
}

/** User may close their own ticket. */
export async function closeOwnTicket(actor: Actor, number: number) {
  const ticket = await getTicket(actor, number);
  if (ticket.userId !== actor.id) throw new AccessError();
  return db.supportTicket.update({ where: { id: ticket.id }, data: { status: "CLOSED", closedAt: new Date(), resolvedAt: ticket.resolvedAt ?? new Date() } });
}

export async function ticketMetrics() {
  const [open, byStatus, resolved] = await Promise.all([
    db.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "AWAITING_USER"] } } }),
    db.supportTicket.groupBy({ by: ["status"], _count: true }),
    db.supportTicket.findMany({ where: { OR: [{ firstResponseAt: { not: null } }, { resolvedAt: { not: null } }] }, select: { createdAt: true, firstResponseAt: true, resolvedAt: true } }),
  ]);
  const avg = (vals: number[]) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
  const firstResp = avg(resolved.filter((t) => t.firstResponseAt).map((t) => (t.firstResponseAt!.getTime() - t.createdAt.getTime()) / 3600_000));
  const resolution = avg(resolved.filter((t) => t.resolvedAt).map((t) => (t.resolvedAt!.getTime() - t.createdAt.getTime()) / 3600_000));
  return { open, byStatus: Object.fromEntries(byStatus.map((b) => [b.status, b._count])), avgFirstResponseHours: firstResp, avgResolutionHours: resolution };
}
