import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Flash, Table, Td, L, SubmitBar } from "@/components/admin/ui";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/form";
import { VideoForm } from "@/components/admin/video-form";
import { createPlaylistAction, saveVideoAction } from "@/server/actions/admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Videos" };

export default async function AdminVideos({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requirePermission("content:manage");
  const sp = await searchParams;
  const [videos, topics, courses, playlists] = await Promise.all([
    db.videoResource.findMany({ include: { topic: true }, orderBy: { updatedAt: "desc" } }),
    db.topic.findMany({ orderBy: { order: "asc" } }), db.course.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    db.videoPlaylist.findMany({ include: { _count: { select: { items: true } } } }),
  ]);
  return (
    <>
      <AdminHeader title="Video management" description="Only add videos whose source and ID you have verified. Unavailable videos can be flagged and replaced." />
      <Flash sp={sp} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {videos.length ? (
            <Table head={["Video", "Source", "Topic", "Verified", "Status"]}>{videos.map((v) => <tr key={v.id}><Td><Link href={`/admin/videos/${v.id}`} className="text-brand hover:underline">{v.title}</Link><span className="block text-xs text-muted">{v.youtubeId}</span></Td><Td>{v.channelName}</Td><Td>{v.topic.shortName}</Td><Td>{v.verifiedAt ? formatDate(v.verifiedAt) : <Badge tone="warning">Unverified</Badge>}</Td><Td><StatusBadge status={v.status} />{v.unavailable && <Badge tone="danger">Unavailable</Badge>}</Td></tr>)}</Table>
          ) : <p className="card p-6 text-sm text-muted">No videos yet. Add the first verified video using the form.</p>}
          <section className="card p-5">
            <h2 className="font-semibold">Playlists</h2>
            <ul className="mt-2 text-sm">{playlists.map((p) => <li key={p.id}>{p.title} ({p._count.items})</li>)}</ul>
            {videos.length > 0 && (
              <form action={createPlaylistAction} className="mt-4 space-y-3 border-t border-line pt-4">
                <L label="Playlist title" htmlFor="pl-title"><Input id="pl-title" name="title" required /></L>
                <L label="Description" htmlFor="pl-desc"><Input id="pl-desc" name="description" /></L>
                <fieldset className="max-h-40 space-y-1 overflow-y-auto text-sm">{videos.map((v) => <label key={v.id} className="flex gap-2"><input type="checkbox" name="videoIds" value={v.id} />{v.title}</label>)}</fieldset>
                <SubmitBar label="Create playlist" />
              </form>
            )}
          </section>
        </div>
        <div><h2 className="mb-3 font-semibold">Add a video</h2><VideoForm action={saveVideoAction.bind(null, null)} topics={topics} courses={courses} /></div>
      </div>
    </>
  );
}
