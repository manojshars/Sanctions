import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Flash, ActionButton } from "@/components/admin/ui";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { inquiryStatusAction } from "@/server/actions/admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Inquiries" };

export default async function AdminInquiries({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requirePermission("support:manage");
  const sp = await searchParams;
  const items = await db.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { org: { select: { name: true } } } });
  return (
    <>
      <AdminHeader title="Corporate, workshop & contact inquiries" />
      <Flash sp={sp} />
      <div className="space-y-3">{items.map((i) => (
        <div key={i.id} className="card p-5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{i.name} <span className="font-normal text-muted">&lt;{i.email}&gt;{i.company ? ` · ${i.company}` : ""}{i.teamSize ? ` · team ${i.teamSize}` : ""}{i.org ? ` · org ${i.org.name}` : ""}</span></p><span className="flex gap-2"><Badge tone="brand">{i.type}</Badge><StatusBadge status={i.status} /></span></div>
          {i.subject && <p className="mt-1 font-medium">{i.subject}</p>}
          <p className="mt-2 whitespace-pre-wrap text-ink/85">{i.message}</p>
          <div className="mt-3 flex items-center gap-2"><span className="text-xs text-muted">{formatDate(i.createdAt)}</span>{i.status !== "CLOSED" && <><ActionButton action={inquiryStatusAction.bind(null, i.id, "IN_PROGRESS")} label="In progress" /><ActionButton action={inquiryStatusAction.bind(null, i.id, "CLOSED")} label="Close" /></>}</div>
        </div>))}{!items.length && <p className="text-sm text-muted">No inquiries yet.</p>}</div>
    </>
  );
}
