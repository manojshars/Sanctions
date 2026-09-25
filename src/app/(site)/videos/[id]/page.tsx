import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, CheckCircle2, ExternalLink, Layers, Lock } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessTopicContent, getEntitlements, hasFeature } from "@/lib/entitlements";
import { YouTubeEmbed } from "@/components/videos/youtube-embed";
import { VideoControls } from "@/components/videos/video-controls";
import { BookmarkButton } from "@/components/common/bookmark-button";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const v = await db.videoResource.findFirst({ where: { id: (await params).id, status: "PUBLISHED" }, select: { title: true, description: true } });
  return v ? { title: v.title, description: v.description } : { title: "Video not found" };
}

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await db.videoResource.findFirst({ where: { id, status: "PUBLISHED" }, include: { topic: true, course: true } });
  if (!v) notFound();
  const user = await getCurrentUser();
  const ent = await getEntitlements(user);
  const allowed = v.accessTier === "FREE" || hasFeature(ent, "PREMIUM_VIDEOS") || canAccessTopicContent(ent, { accessTier: "PREMIUM", topicSlug: v.topic.slug });
  const [progress, saved, decks] = await Promise.all([
    user ? db.videoProgress.findUnique({ where: { userId_videoId: { userId: user.id, videoId: v.id } } }) : null,
    user ? db.bookmark.findFirst({ where: { userId: user.id, entityType: "VIDEO", entityId: v.id } }) : null,
    db.flashcardDeck.findMany({ where: { topicId: v.topicId, ownerId: null, status: "PUBLISHED" }, take: 3 }),
  ]);
  return (
    <div className="container py-10">
      <Link href="/videos" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Video library</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          {v.unavailable ? <p className="card p-6 text-muted">This video is currently unavailable.</p> : allowed ? <YouTubeEmbed youtubeId={v.youtubeId} title={v.title} /> : (
            <div className="card grid aspect-video place-items-center p-6 text-center"><div><Lock className="mx-auto h-8 w-8 text-accent" /><p className="mt-2 font-semibold">Premium video</p><ButtonLink href="/pricing" className="mt-4">View plans</ButtonLink></div></div>
          )}
          <div className="mt-5 flex flex-wrap gap-2"><Badge tone="brand">{v.topic.name}</Badge><LevelBadge level={v.difficulty} />{progress?.watchedAt && <Badge tone="success"><CheckCircle2 className="h-3 w-3" /> Watched</Badge>}</div>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{v.title}</h1>
          <p className="mt-2 text-sm text-muted">Source: {v.channelUrl ? <a href={v.channelUrl} target="_blank" rel="noopener noreferrer" className="underline">{v.channelName}</a> : v.channelName}{v.verifiedAt ? ` · verified ${formatDate(v.verifiedAt)}` : ""} · <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand underline">Open on YouTube <ExternalLink className="h-3 w-3" /></a></p>
          <p className="mt-4 leading-relaxed text-ink/85">{v.description}</p>
          {v.objectives.length > 0 && <div className="card mt-6 p-5"><h2 className="font-semibold">Learning objectives</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{v.objectives.map((o) => <li key={o}>{o}</li>)}</ul></div>}
        </div>
        <aside className="space-y-5">
          {user ? (
            <div className="card p-5">
              <div className="mb-4"><BookmarkButton entityType="VIDEO" entityId={v.id} initial={!!saved} label="Save to watchlist" savedLabel="In watchlist" /></div>
              <VideoControls videoId={v.id} watched={!!progress?.watchedAt} inPlan={!!progress?.inPlan} notes={progress?.notes ?? ""} />
            </div>
          ) : <div className="card p-5 text-sm"><p>Sign in to save videos, track what you&apos;ve watched and keep notes.</p><ButtonLink href={`/login?next=/videos/${v.id}`} className="mt-3" size="sm">Sign in</ButtonLink></div>}
          {v.course && <div className="card p-5"><h2 className="flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4 text-accent" /> Related course</h2><Link href={`/academy/courses/${v.course.slug}`} className="mt-2 block text-sm text-brand hover:underline">{v.course.title}</Link></div>}
          {decks.length > 0 && <div className="card p-5"><h2 className="flex items-center gap-2 font-semibold"><Layers className="h-4 w-4 text-accent" /> Related flashcards</h2><ul className="mt-2 space-y-1 text-sm">{decks.map((d) => <li key={d.id}><Link href={`/flashcards/${d.slug}`} className="text-brand hover:underline">{d.title}</Link></li>)}</ul></div>}
        </aside>
      </div>
    </div>
  );
}
