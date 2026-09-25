import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Table, Td } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Audit log" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission("audit:view");
  const { q } = await searchParams;
  const logs = await db.auditLog.findMany({ where: q ? { OR: [{ action: { contains: q } }, { entityType: { contains: q } }, { entityId: q }] } : {}, include: { actor: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <AdminHeader title="Audit log" description="Sensitive administrative actions (latest 200)." />
      <form className="mb-4"><input name="q" defaultValue={q} placeholder="Filter by action, entity or ID" className="input max-w-sm" aria-label="Filter" /></form>
      <Table head={["When", "Actor", "Action", "Entity", "Details"]}>{logs.map((l) => <tr key={l.id}><Td className="whitespace-nowrap">{formatDate(l.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Td><Td>{l.actor?.name ?? "System"}</Td><Td className="font-mono text-xs">{l.action}</Td><Td className="text-xs">{l.entityType}{l.entityId ? ` · ${l.entityId}` : ""}</Td><Td className="max-w-xs truncate font-mono text-xs">{l.metadata ? JSON.stringify(l.metadata) : ""}</Td></tr>)}</Table>
    </>
  );
}
