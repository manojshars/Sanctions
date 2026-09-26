import { requirePermission } from "@/lib/auth/session";
import { blobStorageEnabled } from "@/lib/storage";
import { db } from "@/lib/db";
import { AdminHeader, Flash } from "@/components/admin/ui";
import { MaterialForm } from "@/components/admin/material-form";
import { createMaterialAction } from "@/server/actions/admin";

export const metadata = { title: "Upload material" };

export default async function NewMaterial({ searchParams }: { searchParams: Promise<{ course?: string; saved?: string; error?: string }> }) {
  await requirePermission("content:manage");
  const sp = await searchParams;
  const [courses, topics] = await Promise.all([
    db.course.findMany({ where: { status: { not: "ARCHIVED" } }, select: { id: true, title: true }, orderBy: { title: "asc" } }),
    db.topic.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
  ]);
  const course = courses.find((c) => c.id === sp.course);
  return (
    <>
      <AdminHeader title="Upload training material" back={course ? { href: `/admin/courses/${course.id}`, label: course.title } : { href: "/admin/materials", label: "Training materials" }} />
      <Flash sp={sp} />
      <MaterialForm action={createMaterialAction} courses={courses} topics={topics} defaultCourseId={course?.id} direct={blobStorageEnabled()} />
    </>
  );
}
