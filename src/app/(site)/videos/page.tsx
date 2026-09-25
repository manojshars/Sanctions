import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PlayCircle, Search, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/section";
import { Badge, LevelBadge, TierBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Video Learning", description: "Curated, source-verified educational videos on financial crime topics." };
export const dynamic = "force-dynamic";

function fmt(s: number | null) { if (!s) return null; const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`; }

export default async function VideosPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const where: Prisma.VideoResourceWhereInput = { status: "PUBLISHED", unavailable: false };
  if (sp.topic) where.topic = { slug: sp.topic };
  if (sp.difficulty) where.difficulty = sp.difficulty as never;
  if (sp.playlist) where.playlistItems = { some: { playlist: { slug: sp.playlist } } };
  if (sp.q) where.OR = [{ title: { contains: sp.q, mode: "insensitive" } }, { description: { contains: sp.q, mode: "insensitive" } }, { channelName: { contains: sp.q, mode: "insensitive" } }];
  if (sp.saved === "1" && user) where.id = { in: (await db.bookmark.findMany({ where: { userId: user.id, entityType: "VIDEO" }, select: { entityId: true } })).map((b) => b.entityId) };
  const [topics, videos, playlists, progress] = await Promise.all([
    db.topic.findMany({ orderBy: { order: "asc" } }),
    db.videoResource.findMany({ where, include: { topic: true }, orderBy: { createdAt: "desc" } }),
    db.videoPlaylist.findMany({ where: { status: "PUBLISHED" }, include: { _count: { select: { items: true } } } }),
    user ? db.videoProgress.findMany({ where: { userId: user.id } }) : Promise.resolve([]),
  ]);
  const watched = new Set(progress.filter((p) => p.watchedAt).map((p) => p.videoId));
  return (
    <>
      <PageHeader eyebrow="Video Learning" title="Curated video library" description="Educational videos from verified sources, organised by topic and level. Videos are hosted by YouTube and remain the property of their creators." />
      <div className="container py-10">
        <form method="get" className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5" role="search">
          <Input name="q" defaultValue={sp.q} placeholder="Search videos" aria-label="Search videos" className="lg:col-span-2" />
          <Select name="topic" defaultValue={sp.topic ?? ""} aria-label="Topic"><option value="">All topics</option>{topics.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</Select>
          <Select name="difficulty" defaultValue={sp.difficulty ?? ""} aria-label="Difficulty"><option value="">Any level</option><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></Select>
          <div className="flex items-center gap-2">{user && <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="saved" value="1" defaultChecked={sp.saved === "1"} /> Watchlist</label>}<Button type="submit" className="flex-1"><Search className="h-4 w-4" /> Filter</Button></div>
        </form>
        {playlists.length > 0 && (
          <section className="mb-8"><h2 className="mb-3 font-semibold">Playlists</h2>
            <div className="flex flex-wrap gap-2">{playlists.map((p) => <Link key={p.id} href={`/videos?playlist=${p.slug}`} className="rounded-full border border-line px-3 py-1 text-sm hover:bg-surface-2">{p.title} ({p._count.items})</Link>)}</div>
          </section>
        )}
        {videos.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <article key={v.id} className="card card-hover relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                <div className="p-4">
                  <div className="flex flex-wrap gap-2"><Badge tone="brand">{v.topic.shortName}</Badge><LevelBadge level={v.difficulty} /><TierBadge tier={v.accessTier} />{watched.has(v.id) && <Badge tone="success">Watched</Badge>}</div>
                  <h3 className="mt-2 font-semibold leading-snug"><Link href={`/videos/${v.id}`} className="after:absolute after:inset-0">{v.title}</Link></h3>
                  <p className="mt-1 text-xs text-muted">Source: {v.channelName}{fmt(v.durationSeconds) ? ` · ${fmt(v.durationSeconds)}` : ""}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon={PlayCircle} title={sp.q || sp.topic || sp.saved ? "No videos match your filters" : "The video library is being curated"}
            description={sp.q || sp.topic || sp.saved ? "Try different filters." : "We only publish videos after an editor verifies the source channel and the video ID. No videos have been published yet — check back soon, or explore courses and case studies in the meantime."}
            action={<Link href="/academy" className="text-sm font-semibold text-brand">Explore the Academy</Link>} />
        )}
        <p className="mt-8 flex items-start gap-2 text-xs text-muted"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Every video record stores the source channel and a verified YouTube video ID. We respect creators&apos; embedding settings and always provide an “Open on YouTube” link.</p>
      </div>
    </>
  );
}
