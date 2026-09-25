import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Flash, Table, Td } from "@/components/admin/ui";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { titleCase } from "@/lib/utils";

export const metadata = { title: "Case studies" };

export default async function AdminCases({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requirePermission("content:manage");
  const sp = await searchParams;
  const cases = await db.caseStudy.findMany({ include: { _count: { select: { attempts: true } } }, orderBy: { updatedAt: "desc" } });
  return (
    <>
      <AdminHeader title="Case study management" actions={<ButtonLink href="/admin/case-studies/new">New case study</ButtonLink>} />
      <Flash sp={sp} />
      <Table head={["Case", "Category", "Type", "Attempts", "Status"]}>{cases.map((c) => <tr key={c.id}><Td><Link href={`/admin/case-studies/${c.id}`} className="text-brand hover:underline">{c.title}</Link>{c.featured && <Badge tone="gold" className="ml-2">Featured</Badge>}</Td><Td>{titleCase(c.category)}</Td><Td>{c.isFictional ? "Fictional" : "Enforcement-based"}</Td><Td>{c._count.attempts}</Td><Td><StatusBadge status={c.status} /></Td></tr>)}</Table>
    </>
  );
}
