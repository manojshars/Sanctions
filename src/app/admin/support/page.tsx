import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ticketMetrics } from "@/server/services/support";
import { AdminHeader, Table, Td } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Support" };

export default async function AdminSupport({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const actor = await requirePermission("support:manage");
  const sp = await searchParams;
  const where: Prisma.SupportTicketWhereInput = {};
  if (sp.status) where.status = sp.status as never; else if (!sp.all) where.status = { in: ["OPEN", "IN_PROGRESS", "AWAITING_USER"] };
  if (sp.priority) where.priority = sp.priority as never;
  if (sp.mine) where.assigneeId = actor.id;
  if (sp.q) where.OR = [{ subject: { contains: sp.q, mode: "insensitive" } }, { user: { email: { contains: sp.q, mode: "insensitive" } } }, ...(Number(sp.q) ? [{ number: Number(sp.q) }] : [])];
  const [tickets, m] = await Promise.all([db.supportTicket.findMany({ where, include: { user: { select: { name: true, email: true } }, assignee: { select: { name: true } } }, orderBy: [{ priority: "desc" }, { updatedAt: "desc" }], take: 100 }), ticketMetrics()]);
  const hrs = (h: number | null) => (h == null ? "—" : `${h.toFixed(1)} h`);
  return (
    <>
      <AdminHeader title="Support management" />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open (all active)" value={m.open} /><Stat label="Awaiting user" value={m.byStatus.AWAITING_USER ?? 0} />
        <Stat label="Avg first response" value={hrs(m.avgFirstResponseHours)} /><Stat label="Avg resolution" value={hrs(m.avgResolutionHours)} />
      </div>
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search subject, email or #" className="input max-w-xs" aria-label="Search tickets" />
        <select name="status" defaultValue={sp.status ?? ""} className="input w-auto" aria-label="Status"><option value="">Active</option>{["OPEN", "IN_PROGRESS", "AWAITING_USER", "RESOLVED", "CLOSED"].map((x) => <option key={x}>{x}</option>)}</select>
        <select name="priority" defaultValue={sp.priority ?? ""} className="input w-auto" aria-label="Priority"><option value="">Any priority</option>{["LOW", "NORMAL", "HIGH", "URGENT"].map((x) => <option key={x}>{x}</option>)}</select>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="mine" value="1" defaultChecked={!!sp.mine} /> Assigned to me</label>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="all" value="1" defaultChecked={!!sp.all} /> Include closed</label>
        <button className="rounded-lg border border-line px-3 text-sm">Filter</button>
      </form>
      <Table head={["Ticket", "Requester", "Category", "Priority", "Assignee", "Updated", "Status"]}>
        {tickets.map((t) => <tr key={t.id}><Td><Link href={`/admin/support/${t.number}`} className="font-medium text-brand hover:underline">#{t.number} {t.subject}</Link></Td><Td>{t.user.name}<span className="block text-xs text-muted">{t.user.email}</span></Td><Td>{t.category}</Td><Td><StatusBadge status={t.priority} /></Td><Td>{t.assignee?.name ?? "—"}</Td><Td>{formatDate(t.updatedAt)}</Td><Td><StatusBadge status={t.status} /></Td></tr>)}
      </Table>
    </>
  );
}
