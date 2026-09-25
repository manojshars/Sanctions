import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Layers, Lock, RotateCcw, Search, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { flashcardStats, listDecks, upcomingSchedule } from "@/server/services/flashcards";
import { PageHeader } from "@/components/ui/section";
import { Badge, TierBadge } from "@/components/ui/badge";
import { ButtonLink, Button } from "@/components/ui/button";
import { EmptyState, Progress, Stat } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form";
import { CreateDeckForm } from "@/components/flashcards/deck-forms";

export const metadata: Metadata = { title: "Flashcard Library", description: "Topic-based financial crime flashcards with spaced repetition." };
export const dynamic = "force-dynamic";

export default async function FlashcardsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const user = await getCurrentUser();
  const decks = await listDecks(user, q);
  const stats = user ? await flashcardStats(user.id) : null;
  const upcoming = user ? await upcomingSchedule(user.id, 7) : [];
  const official = decks.filter((d) => !d.ownerId);
  const mine = decks.filter((d) => d.ownerId);
  const max = Math.max(1, ...upcoming.map((u) => u.count));
  return (
    <>
      <PageHeader eyebrow="Revision" title="Flashcard Library" description="Study topic-based decks, rate your recall, and let the spaced-repetition scheduler decide when you see each card again.">
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/flashcards/review" variant="gold"><RotateCcw className="h-4 w-4" /> Daily review{stats ? ` (${stats.dueToday} due)` : ""}</ButtonLink>
          <ButtonLink href="/flashcards/daily" className="border border-white/20 bg-transparent text-white hover:bg-white/10 dark:bg-transparent dark:text-white"><Sparkles className="h-4 w-4" /> Flashcard of the Day</ButtonLink>
        </div>
      </PageHeader>
      <div className="container space-y-10 py-10">
        {stats && (
          <section aria-label="Revision dashboard" className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Due today" value={stats.dueToday} icon={CalendarClock} />
              <Stat label="Upcoming (7 days)" value={stats.upcoming} icon={RotateCcw} />
              <Stat label="Cards mastered" value={stats.mastered} icon={CheckCircle2} hint="Interval of 21+ days" />
              <Stat label="Needs revision" value={stats.needsRevision} icon={Layers} />
            </div>
            <div className="card p-5">
              <p className="font-semibold">Upcoming reviews</p>
              <div className="mt-4 flex h-32 items-end gap-2" role="img" aria-label={`Upcoming reviews: ${upcoming.map((u) => `${u.day} ${u.count}`).join(", ")}`}>
                {upcoming.map((u) => (
                  <div key={u.day} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs text-muted">{u.count || ""}</span>
                    <div className="w-full rounded-t-md bg-gold-400/80" style={{ height: `${(u.count / max) * 100}%`, minHeight: u.count ? 4 : 0 }} />
                    <span className="text-[10px] text-muted">{new Date(u.day).toLocaleDateString("en-GB", { weekday: "short" })}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        <form method="get" className="flex max-w-lg gap-2" role="search">
          <label htmlFor="deck-q" className="sr-only">Search flashcards</label>
          <Input id="deck-q" name="q" defaultValue={q} placeholder="Search decks and card content" />
          <Button type="submit" variant="secondary"><Search className="h-4 w-4" /> Search</Button>
        </form>
        <section>
          <h2 className="mb-4 text-xl font-bold">Topic decks</h2>
          {official.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {official.map((d) => (
                <article key={d.id} className="card card-hover relative flex flex-col p-5">
                  <div className="flex items-center justify-between"><Badge tone="brand">{d.topic?.shortName ?? "General"}</Badge><TierBadge tier={d.accessTier} /></div>
                  <h3 className="mt-3 font-semibold"><Link href={`/flashcards/${d.slug}`} className="after:absolute after:inset-0">{d.title}</Link></h3>
                  <p className="mt-1 flex-1 text-sm text-muted">{d.description}</p>
                  <p className="mt-3 text-xs text-muted">{d._count.cards} cards{user ? ` · ${d.progress.reviewed} reviewed · ${d.progress.mastered} mastered · ${d.progress.due} due` : ""}</p>
                  {user && d._count.cards > 0 && <Progress value={(d.progress.reviewed / d._count.cards) * 100} tone="gold" className="mt-2" label={`${d.title} reviewed`} />}
                  {!d.accessible && <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent"><Lock className="h-3.5 w-3.5" /> Premium deck</p>}
                </article>
              ))}
            </div>
          ) : <EmptyState title="No decks found" description="Try a different search." />}
        </section>
        {user && (
          <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div>
              <h2 className="mb-4 text-xl font-bold">My decks</h2>
              {mine.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {mine.map((d) => (
                    <Link key={d.id} href={`/flashcards/${d.slug}`} className="card card-hover p-5">
                      <p className="font-semibold">{d.title}</p>
                      <p className="text-sm text-muted">{d._count.cards + d._count.collected} cards · {d.progress.due} due</p>
                    </Link>
                  ))}
                </div>
              ) : <EmptyState icon={Layers} title="No personal decks yet" description="Create a deck, add your own cards, or use “Add to My Deck” while studying." />}
            </div>
            <div className="card p-5"><h2 className="mb-3 font-semibold">Create a personal deck</h2><CreateDeckForm /></div>
          </section>
        )}
        <p className="text-xs text-muted">Long-term content goals include expanded AML, sanctions, fraud, ABC and KYC decks. Counts above reflect cards currently published.</p>
      </div>
    </>
  );
}
