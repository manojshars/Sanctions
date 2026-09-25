import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getTicket } from "@/server/services/support";
import { NotFoundError } from "@/server/services/courses";
import { AdminHeader } from "@/components/admin/ui";
import { TicketThread } from "@/components/support/thread";
import { ReplyForm, TicketAdminForm } from "@/components/support/ticket-forms";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Ticket" };

export default async function AdminTicket({ params }: { params: Promise<{ number: string }> }) {
  const actor = await requirePermission("support:manage");
  const n = Number((await params).number);
  let t;
  try { t = await getTicket(actor, n); } catch (e) { if (e instanceof NotFoundError) notFound(); throw e; }
  const staff = await db.user.findMany({ where: { role: { in: ["SUPPORT", "ADMIN"] }, status: "ACTIVE" }, select: { id: true, name: true } });
  return (
    <>
      <AdminHeader title={`#${t.number} ${t.subject}`} back={{ href: "/admin/support", label: "Support" }} description={`${t.user.name} (${t.user.email}) · ${t.category} · opened ${formatDate(t.createdAt)}${t.firstResponseAt ? ` · first response ${formatDate(t.firstResponseAt)}` : ""}${t.resolvedAt ? ` · resolved ${formatDate(t.resolvedAt)}` : ""}`} actions={<><StatusBadge status={t.status} /><StatusBadge status={t.priority} /></>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div><TicketThread messages={t.messages} requesterId={t.userId} /><div className="card mt-6 p-5"><ReplyForm number={t.number} staff /></div></div>
        <aside className="card self-start p-5"><TicketAdminForm number={t.number} status={t.status} priority={t.priority} assigneeId={t.assigneeId} staff={staff} /></aside>
      </div>
    </>
  );
}
