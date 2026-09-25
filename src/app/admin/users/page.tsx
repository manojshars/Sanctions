import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { listUsers } from "@/server/services/admin/users";
import { AdminHeader, Table, Td } from "@/components/admin/ui";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Users" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const actor = await requirePermission("users:manage");
  const sp = await searchParams;
  const r = await listUsers(actor, { q: sp.q, role: sp.role, status: sp.status, page: Number(sp.page) || 1 });
  const href = (p: number) => `/admin/users?${new URLSearchParams(Object.entries({ ...sp, page: String(p) }).filter(([, v]) => v) as [string, string][])}`;
  return (
    <>
      <AdminHeader title="User management" description={`${r.total} users`} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search name or email" className="input max-w-xs" aria-label="Search users" />
        <select name="role" defaultValue={sp.role ?? ""} className="input w-auto" aria-label="Role"><option value="">All roles</option>{["LEARNER", "EDITOR", "SUPPORT", "ADMIN"].map((x) => <option key={x}>{x}</option>)}</select>
        <select name="status" defaultValue={sp.status ?? ""} className="input w-auto" aria-label="Status"><option value="">All statuses</option>{["ACTIVE", "SUSPENDED", "DELETED"].map((x) => <option key={x}>{x}</option>)}</select>
        <button className="rounded-lg border border-line px-3 text-sm">Filter</button>
      </form>
      <Table head={["User", "Role", "Membership", "Enrolments", "Tickets", "Joined", "Status"]}>
        {r.users.map((u) => <tr key={u.id}><Td><Link href={`/admin/users/${u.id}`} className="font-medium text-brand hover:underline">{u.name}</Link><span className="block text-xs text-muted">{u.email}</span></Td><Td><Badge tone={u.role === "ADMIN" ? "danger" : u.role === "LEARNER" ? "neutral" : "brand"}>{u.role}</Badge></Td><Td>{u.memberships.map((m) => m.plan?.name ?? m.package?.name).join(", ") || "Free"}</Td><Td>{u._count.enrollments}</Td><Td>{u._count.tickets}</Td><Td>{formatDate(u.createdAt)}</Td><Td><StatusBadge status={u.status} /></Td></tr>)}
      </Table>
      <Pagination page={r.page} pages={r.pages} makeHref={href} />
    </>
  );
}
