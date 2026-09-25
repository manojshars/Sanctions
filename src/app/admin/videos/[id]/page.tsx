import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Flash, ActionButton } from "@/components/admin/ui";
import { VideoForm } from "@/components/admin/video-form";
import { videoAvailabilityAction, saveVideoAction } from "@/server/actions/admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Video" };

export default async function AdminVideo({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requirePermission("content:manage");
  const { id } = await params;
  const sp = await searchParams;
  const [v, topics, courses] = await Promise.all([db.videoResource.findUnique({ where: { id } }), db.topic.findMany({ orderBy: { order: "asc" } }), db.course.findMany({ select: { id: true, title: true } })]);
  if (!v) notFound();
  return (
    <>
      <AdminHeader title={v.title} back={{ href: "/admin/videos", label: "Videos" }} description={`YouTube ID ${v.youtubeId} · ${v.verifiedAt ? `verified ${formatDate(v.verifiedAt)}` : "not verified"}`}
        actions={<ActionButton action={videoAvailabilityAction.bind(null, v.id, !v.unavailable)} label={v.unavailable ? "Mark available" : "Mark unavailable"} tone={v.unavailable ? "default" : "danger"} />} />
      <Flash sp={sp} />
      <VideoForm action={saveVideoAction.bind(null, v.id)} v={v} topics={topics} courses={courses} />
    </>
  );
}
