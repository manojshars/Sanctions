import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Flash, ActionButton, L } from "@/components/admin/ui";
import { CourseForm } from "@/components/admin/course-form";
import { StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/form";
import { courseStatusAction, deleteModuleAction, saveCourseAction, saveModuleAction } from "@/server/actions/admin";

export const metadata = { title: "Edit course" };

export default async function EditCourse({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requirePermission("content:manage");
  const { id } = await params;
  const sp = await searchParams;
  const [course, topics] = await Promise.all([
    db.course.findUnique({ where: { id }, include: { objectives: { orderBy: { order: "asc" } }, modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } }, _count: { select: { questions: true, enrollments: true } } } }),
    db.topic.findMany({ orderBy: { order: "asc" } }),
  ]);
  if (!course) notFound();
  return (
    <>
      <AdminHeader title={course.title} back={{ href: "/admin/courses", label: "Courses" }} description={`${course._count.enrollments} enrolments · ${course._count.questions} linked questions`}
        actions={<><StatusBadge status={course.status} />{course.status !== "PUBLISHED" && <ActionButton action={courseStatusAction.bind(null, course.id, "PUBLISHED")} label="Publish" tone="primary" />}{course.status === "PUBLISHED" && <ActionButton action={courseStatusAction.bind(null, course.id, "DRAFT")} label="Unpublish" />}{course.status !== "ARCHIVED" && <ActionButton action={courseStatusAction.bind(null, course.id, "ARCHIVED")} label="Archive" tone="danger" />}{course.status === "PUBLISHED" && <Link href={`/academy/courses/${course.slug}`} className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm">View</Link>}</>} />
      <Flash sp={sp} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <CourseForm action={saveCourseAction.bind(null, course.id)} course={course} topics={topics} />
        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="font-semibold">Modules & lessons</h2>
            <div className="mt-3 space-y-4">
              {course.modules.map((m) => (
                <div key={m.id} className="rounded-xl border border-line p-3">
                  <form action={saveModuleAction.bind(null, course.id, m.id)} className="flex flex-wrap items-end gap-2">
                    <Input name="order" type="number" defaultValue={m.order} className="w-16" aria-label="Module order" />
                    <Input name="title" defaultValue={m.title} className="min-w-40 flex-1" aria-label="Module title" />
                    <input type="hidden" name="summary" value={m.summary ?? ""} />
                    <button className="h-10 rounded-lg border border-line px-3 text-sm">Save</button>
                  </form>
                  <ul className="mt-2 space-y-1 text-sm">{m.lessons.map((l) => <li key={l.id}><Link href={`/admin/courses/${course.id}/lessons/${l.id}`} className="text-brand hover:underline">{l.order + 1}. {l.title}</Link> <span className="text-xs text-muted">({l.type.toLowerCase()}, {l.durationMinutes} min)</span></li>)}</ul>
                  <div className="mt-2 flex gap-2"><Link href={`/admin/courses/${course.id}/lessons/new?module=${m.id}`} className="text-sm font-semibold text-brand">+ Add lesson</Link><span className="ml-auto"><ActionButton action={deleteModuleAction.bind(null, course.id, m.id)} label="Delete module" tone="danger" /></span></div>
                </div>
              ))}
            </div>
            <form action={saveModuleAction.bind(null, course.id, null)} className="mt-4 space-y-2 border-t border-line pt-4">
              <L label="New module title" htmlFor="new-module"><Input id="new-module" name="title" required /></L>
              <input type="hidden" name="order" value={course.modules.length} />
              <button className="h-9 rounded-lg bg-navy px-3 text-sm text-white dark:bg-gold-400 dark:text-navy">Add module</button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
