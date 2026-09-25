import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Flash, Table, Td } from "@/components/admin/ui";
import { StatusBadge, TierBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { titleCase } from "@/lib/utils";

export const metadata = { title: "Questions" };

export default async function AdminQuestions({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("content:manage");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.QuestionWhereInput = {};
  if (sp.status) where.status = sp.status as never;
  if (sp.topic) where.topicId = sp.topic;
  if (sp.type) where.type = sp.type as never;
  if (sp.q) where.stem = { contains: sp.q, mode: "insensitive" };
  const [topics, total, items, counts] = await Promise.all([
    db.topic.findMany({ orderBy: { order: "asc" } }), db.question.count({ where }),
    db.question.findMany({ where, include: { topic: true }, orderBy: { updatedAt: "desc" }, skip: (page - 1) * 30, take: 30 }),
    db.question.groupBy({ by: ["status"], _count: true }),
  ]);
  const qs = (p: number) => `/admin/questions?${new URLSearchParams(Object.entries({ ...sp, page: String(p) }).filter(([k, v]) => v && !["saved", "error"].includes(k)) as [string, string][])}`;
  return (
    <>
      <AdminHeader title="Question management" description={counts.map((c) => `${c._count} ${c.status.toLowerCase().replace("_", " ")}`).join(" · ")} actions={<><ButtonLink href="/admin/questions/import" variant="secondary">Import CSV</ButtonLink><ButtonLink href="/admin/questions/new">New question</ButtonLink></>} />
      <Flash sp={sp} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search question text" className="input max-w-xs" aria-label="Search" />
        <select name="status" defaultValue={sp.status ?? ""} className="input w-auto" aria-label="Status"><option value="">All statuses</option>{["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"].map((s) => <option key={s}>{s}</option>)}</select>
        <select name="topic" defaultValue={sp.topic ?? ""} className="input w-auto" aria-label="Topic"><option value="">All topics</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <select name="type" defaultValue={sp.type ?? ""} className="input w-auto" aria-label="Type"><option value="">All types</option>{["SINGLE", "MULTIPLE", "TRUE_FALSE", "SCENARIO", "MATCHING", "FILL_BLANK", "SHORT_ANSWER", "INVESTIGATION"].map((s) => <option key={s}>{s}</option>)}</select>
        <button className="rounded-lg border border-line px-3 text-sm">Filter</button>
      </form>
      <p className="mb-2 text-sm text-muted">{total} questions</p>
      <Table head={["Question", "Topic", "Type", "Difficulty", "Access", "Version", "Status"]}>
        {items.map((q) => <tr key={q.id}><Td className="max-w-md"><Link href={`/admin/questions/${q.id}`} className="line-clamp-2 text-brand hover:underline">{q.stem}</Link></Td><Td>{q.topic.shortName}</Td><Td>{titleCase(q.type)}</Td><Td>{titleCase(q.difficulty)}</Td><Td><TierBadge tier={q.accessTier} /></Td><Td>v{q.version}</Td><Td><StatusBadge status={q.status} /></Td></tr>)}
      </Table>
      <Pagination page={page} pages={Math.ceil(total / 30)} makeHref={qs} />
    </>
  );
}
