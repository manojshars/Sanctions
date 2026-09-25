"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, PartyPopper, Plus, Shuffle } from "lucide-react";
import { FlipCard } from "./flip-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/feedback";
import { BookmarkButton } from "@/components/common/bookmark-button";
import { addToDeckAction, rateCardAction } from "@/server/actions/flashcards";
import type { CardRating } from "@/lib/srs";
import { cn } from "@/lib/utils";

export type StudyCard = {
  id: string; front: string; back: string; explanation: string | null; deckTitle?: string; bookmarked: boolean;
  review: { state: string; intervalDays: number; nextReviewAt: string; known: boolean; lastRating: string | null } | null;
};

const BUTTONS: { rating: CardRating; label: string; cls: string; hint: string }[] = [
  { rating: "AGAIN", label: "Needs revision", cls: "border-danger/40 text-danger hover:bg-danger/10", hint: "again in 10 min" },
  { rating: "HARD", label: "Difficult", cls: "border-warning/40 text-warning hover:bg-warning/10", hint: "shorter interval" },
  { rating: "GOOD", label: "Medium", cls: "border-brand/40 text-brand hover:bg-brand/10", hint: "normal interval" },
  { rating: "EASY", label: "Easy", cls: "border-success/40 text-success hover:bg-success/10", hint: "longer interval" },
];

function describeNext(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 3600_000) return "in a few minutes";
  const days = Math.round(ms / 86400_000);
  return days <= 1 ? "tomorrow" : `in ${days} days`;
}

export function StudyDeck({ cards: initial, isOwn, emptyHref = "/flashcards" }: { cards: StudyCard[]; isOwn?: boolean; emptyHref?: string }) {
  const [cards, setCards] = useState(initial);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [rated, setRated] = useState(0);
  const card = cards[i];
  useEffect(() => setFlipped(false), [i]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") setI((x) => Math.min(cards.length - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
      if (e.key === " ") { e.preventDefault(); setFlipped((f) => !f); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards.length]);
  const known = useMemo(() => cards.filter((c) => c.review?.known).length, [cards]);

  if (!cards.length) {
    return (
      <div className="card flex flex-col items-center p-10 text-center">
        <PartyPopper className="h-10 w-10 text-accent" />
        <p className="mt-3 text-lg font-semibold">Nothing to study here right now</p>
        <Link href={emptyHref} className="mt-3 text-sm font-semibold text-brand hover:underline">Back to the flashcard library</Link>
      </div>
    );
  }

  function rate(rating: CardRating, knownFlag?: boolean) {
    start(async () => {
      const r = await rateCardAction(card.id, rating, knownFlag);
      if (!r.ok) { setMsg(r.error); return; }
      setCards((prev) => prev.map((c, j) => (j === i ? { ...c, review: { state: r.state, intervalDays: r.intervalDays, nextReviewAt: r.nextReviewAt, known: r.known, lastRating: rating } } : c)));
      setRated((n) => n + 1);
      setMsg(`Scheduled — next review ${describeNext(r.nextReviewAt)}.`);
      if (i < cards.length - 1) setTimeout(() => setI((x) => x + 1), 450);
    });
  }

  function shuffle() {
    const a = [...cards];
    for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; }
    setCards(a); setI(0); setMsg("Deck shuffled.");
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted">Card {i + 1} of {cards.length} · {known} known · {rated} rated this session</span>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={shuffle}><Shuffle className="h-4 w-4" /> Shuffle</Button>
        </div>
      </div>
      <Progress value={((i + 1) / cards.length) * 100} className="mb-5" label="Deck position" />
      <FlipCard key={card.id} front={card.front} back={card.back} explanation={card.explanation} topic={card.deckTitle} flipped={flipped} onFlip={setFlipped} size="lg" />
      <div className="mt-5" aria-live="polite">
        {flipped ? (
          <div>
            <p className="mb-2 text-center text-sm text-muted">How well did you know this?</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BUTTONS.map((b) => (
                <button key={b.rating} type="button" disabled={pending} onClick={() => rate(b.rating)} className={cn("rounded-xl border bg-surface px-3 py-2.5 text-sm font-semibold transition disabled:opacity-50", b.cls)}>
                  {b.label}<span className="block text-[11px] font-normal opacity-75">{b.hint}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center"><Button onClick={() => setFlipped(true)}>Reveal answer</Button></div>
        )}
        {msg && <p className="mt-3 text-center text-sm text-muted">{msg}</p>}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <Button variant="secondary" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}><ArrowLeft className="h-4 w-4" /> Previous</Button>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={() => rate("EASY", true)} aria-pressed={!!card.review?.known}
            className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium", card.review?.known ? "border-success/50 bg-success/10 text-success" : "border-line text-muted hover:text-ink")}>
            <CheckCircle2 className="h-4 w-4" /> {card.review?.known ? "Known" : "Mark as known"}
          </button>
          <BookmarkButton key={card.id} entityType="FLASHCARD" entityId={card.id} initial={card.bookmarked} label="Bookmark" />
          {!isOwn && <AddToDeck cardId={card.id} />}
        </div>
        <Button variant="secondary" onClick={() => setI((x) => Math.min(cards.length - 1, x + 1))} disabled={i === cards.length - 1}>Next <ArrowRight className="h-4 w-4" /></Button>
      </div>
      {card.review && <p className="mt-3 text-center text-xs text-muted">Status: {card.review.state.toLowerCase()} · interval {card.review.intervalDays} day(s) · next review {describeNext(card.review.nextReviewAt)}</p>}
      <p className="mt-2 text-center text-xs text-muted">Keyboard: Space to flip, ← → to navigate.</p>
    </div>
  );
}

export function AddToDeck({ cardId }: { cardId: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  return (
    <button type="button" disabled={pending || !!done} onClick={() => start(async () => { const r = await addToDeckAction(cardId); setDone(r.ok ? `Added to ${r.deckTitle}` : r.error); })}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-ink disabled:opacity-70">
      <Plus className="h-4 w-4" /> {done ?? "Add to My Deck"}
    </button>
  );
}
