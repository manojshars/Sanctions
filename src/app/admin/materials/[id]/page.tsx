import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Flash } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { MaterialForm } from "@/components/admin/material-form";
import { deleteMaterialAction, updateMaterialAction } from "@/server/actions/admin";
import { formatBytes, formatDate } from "@/lib/utils";

export const metadata = { title: "Material" };

export default async function EditMaterial({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requirePermission("content:manage");
  const { id } = await params;
  const sp = await searchParams;
  const [m, courses, topics] = await Promise.all([
    db.courseResource.findUnique({ where: { id }, include: { course: { select: { id: true, title: true, status: true } } } }),
    db.course.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    db.topic.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!m) notFound();
  const file = m.storageKey ? `PDF · ${formatBytes(m.sizeBytes)}${m.pageCount ? ` · ${m.pageCount} pages` : ""}` : "Text resource (seeded) — upload a PDF to replace it";
  return (
    <>
      <AdminHeader title={m.title} back={{ href: "/admin/materials", label: "Training materials" }}
        description={`${m.filename} · ${file} · updated ${formatDate(m.updatedAt)}`}
        actions={<>
          <a href={`/admin/materials/${m.id}/file`} className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm font-medium hover:bg-surface-2">Download</a>
          {m.course && <Link href={`/admin/courses/${m.course.id}`} className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm font-medium hover:bg-surface-2">Open course</Link>}
          <ConfirmButton action={deleteMaterialAction.bind(null, m.id)} label="Delete material" confirm={`Permanently delete "${m.title}" and its file? This cannot be undone.`} />
        </>} />
      <Flash sp={sp} />
      <MaterialForm action={updateMaterialAction.bind(null, m.id)} m={m} courses={courses} topics={topics} />
    </>
  );
}
