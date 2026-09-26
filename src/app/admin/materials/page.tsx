import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { AdminHeader, Flash, Table, Td } from "@/components/admin/ui";
import { Badge, TierBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/form";
import { listMaterials } from "@/server/services/admin/materials";
import { formatBytes, formatDate } from "@/lib/utils";

export const metadata = { title: "Training materials" };

type SP = { q?: string; scope?: string; page?: string; saved?: string; error?: string };

export default async function AdminMaterials({ searchParams }: { searchParams: Promise<SP> }) {
  await requirePermission("content:manage");
  const sp = await searchParams;
  const scope = sp.scope === "course" || sp.scope === "library" ? sp.scope : undefined;
  const { items, total, page, pages } = await listMaterials({ q: sp.q?.trim() || undefined, scope, page: Number(sp.page) || 1 });
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(scope ? { scope } : {}), page: String(p) })}`;
  return (
    <>
      <AdminHeader title="Training materials" description={`${total} downloadable materials. Upload PDFs for a course, or as standalone items in the public resource library.`}
        actions={<Link href="/admin/materials/new" className="inline-flex h-9 items-center rounded-lg bg-navy px-3 text-sm font-medium text-white dark:bg-gold-400 dark:text-navy">Upload PDF</Link>} />
      <Flash sp={sp} />
      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <Input name="q" defaultValue={sp.q} placeholder="Search title or file name" aria-label="Search materials" className="max-w-xs" />
        <Select name="scope" defaultValue={scope ?? ""} aria-label="Filter by type" className="max-w-[12rem]"><option value="">All materials</option><option value="course">Course materials</option><option value="library">Standalone library</option></Select>
        <button className="h-10 rounded-lg border border-line px-4 text-sm">Filter</button>
      </form>
      {items.length ? (
        <Table head={["Material", "Course / topic", "File", "Access", "Status", "Updated"]}>
          {items.map((m) => (
            <tr key={m.id}>
              <Td><Link href={`/admin/materials/${m.id}`} className="font-medium text-brand hover:underline">{m.title}</Link></Td>
              <Td>{m.course ? <Link href={`/admin/courses/${m.course.id}`} className="hover:underline">{m.course.title}</Link> : <span>Library · {m.topic?.shortName ?? "—"}</span>}</Td>
              <Td><span className="block">{m.filename}</span><span className="text-xs text-muted">{m.storageKey ? `PDF · ${formatBytes(m.sizeBytes)}${m.pageCount ? ` · ${m.pageCount} pages` : ""}` : "Text (seeded)"}</span></Td>
              <Td><TierBadge tier={m.accessTier} /></Td>
              <Td>{m.isPublished ? <Badge tone="success">Published</Badge> : <Badge tone="warning">Hidden</Badge>}</Td>
              <Td className="whitespace-nowrap">{formatDate(m.updatedAt)}</Td>
            </tr>
          ))}
        </Table>
      ) : <p className="card p-6 text-sm text-muted">No materials match. <Link href="/admin/materials/new" className="text-brand underline">Upload the first PDF</Link>.</p>}
      {pages > 1 && (
        <nav className="mt-4 flex items-center gap-3 text-sm" aria-label="Pagination">
          {page > 1 && <Link href={qs(page - 1)} className="text-brand">← Previous</Link>}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages && <Link href={qs(page + 1)} className="text-brand">Next →</Link>}
        </nav>
      )}
    </>
  );
}
