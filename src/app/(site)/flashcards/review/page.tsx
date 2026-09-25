import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getDueCards, flashcardStats } from "@/server/services/flashcards";
import { StudyDeck } from "@/components/flashcards/study-deck";

export const metadata: Metadata = { title: "Daily review", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await requireUser("/flashcards/review");
  const [due, stats] = await Promise.all([getDueCards(user, 50), flashcardStats(user.id)]);
  return (
    <div className="container max-w-4xl py-10">
      <p className="eyebrow">Spaced repetition</p>
      <h1 className="mt-1 text-3xl font-bold">Daily review</h1>
      <p className="mt-1 text-muted">{stats.dueToday} card(s) due today · {stats.mastered} mastered. New cards join your schedule when you study a deck.</p>
      <div className="mt-8">
        <StudyDeck cards={due.map((c) => ({ id: c.id, front: c.front, back: c.back, explanation: c.explanation, deckTitle: c.deck.title, bookmarked: false, review: { state: c.review.state, intervalDays: c.review.intervalDays, nextReviewAt: c.review.nextReviewAt.toISOString(), known: c.review.known, lastRating: c.review.lastRating } }))} />
      </div>
    </div>
  );
}
