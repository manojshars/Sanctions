import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Flash, L, SubmitBar, ActionButton } from "@/components/admin/ui";
import { Input, Select, Textarea } from "@/components/ui/form";
import { Prose } from "@/components/ui/prose";
import { deleteLessonAction, saveLessonAction } from "@/server/actions/admin";

export const metadata = { title: "Lesson" };

export default async function LessonEditor({ params, searchParams }: { params: Promise<{ id: string; lessonId: string }>; searchParams: Promise<{ module?: string; saved?: string; error?: string }> }) {
  await requirePermission("content:manage");
  const { id, lessonId } = await params;
  const sp = await searchParams;
  const course = await db.course.findUnique({ where: { id }, include: { modules: { orderBy: { order: "asc" } } } });
  if (!course) notFound();
  const lesson = lessonId === "new" ? null : await db.lesson.findUnique({ where: { id: lessonId } });
  if (lessonId !== "new" && !lesson) notFound();
  const moduleId = lesson?.moduleId ?? sp.module ?? course.modules[0]?.id;
  if (!moduleId) notFound();
  const videos = await db.videoResource.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true } });
  const nextOrder = lesson?.order ?? (await db.lesson.count({ where: { moduleId } }));
  return (
    <>
      <AdminHeader title={lesson ? `Edit lesson: ${lesson.title}` : "New lesson"} back={{ href: `/admin/courses/${id}`, label: course.title }} actions={lesson && <ActionButton action={deleteLessonAction.bind(null, id, lesson.id)} label="Delete lesson" tone="danger" />} />
      <Flash sp={sp} />
      <div className="grid gap-6 xl:grid-cols-2">
        <form action={saveLessonAction.bind(null, id, moduleId, lesson?.id ?? null)} className="card space-y-4 p-5">
          <L label="Title" htmlFor="title"><Input id="title" name="title" defaultValue={lesson?.title} required /></L>
          <div className="grid gap-4 sm:grid-cols-3">
            <L label="Type" htmlFor="type"><Select id="type" name="type" defaultValue={lesson?.type ?? "READING"}><option>READING</option><option>VIDEO</option><option>EXERCISE</option></Select></L>
            <L label="Duration (min)" htmlFor="durationMinutes"><Input id="durationMinutes" name="durationMinutes" type="number" min={1} defaultValue={lesson?.durationMinutes ?? 10} /></L>
            <L label="Order" htmlFor="order"><Input id="order" name="order" type="number" min={0} defaultValue={nextOrder} /></L>
          </div>
          <L label="Content (Markdown)" htmlFor="content"><Textarea id="content" name="content" defaultValue={lesson?.content} className="min-h-[360px] font-mono text-xs" required /></L>
          <L label="Practical exercise (optional)" htmlFor="exercise"><Textarea id="exercise" name="exercise" defaultValue={lesson?.exercise ?? ""} /></L>
          <L label="Video (optional)" htmlFor="videoId"><Select id="videoId" name="videoId" defaultValue={lesson?.videoId ?? ""}><option value="">None</option>{videos.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}</Select></L>
          <SubmitBar label="Save lesson" />
        </form>
        {lesson && <div className="card p-5"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Preview</p><Prose markdown={lesson.content} /></div>}
      </div>
    </>
  );
}
