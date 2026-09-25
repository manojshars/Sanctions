import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Layers } from "lucide-react";
import { flashcardOfTheDay } from "@/server/services/flashcards";
import { getCurrentUser } from "@/lib/auth/session";
import { FlipCard } from "@/components/flashcards/flip-card";
import { AddToDeck } from "@/components/flashcards/study-deck";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Flashcard of the Day", description: "A daily financial crime concept to learn and revise." };
export const dynamic = "force-dynamic";

export default async function DailyCardPage() {
  const [card, user] = await Promise.all([flashcardOfTheDay(), getCurrentUser()]);
  return (
    <div className="container max-w-3xl py-12">
      <p className="eyebrow">Flashcard of the Day · {formatDate(new Date())}</p>
      <h1 className="mt-1 text-3xl font-bold">Today&apos;s concept</h1>
      {card ? (
        <>
          <div className="mt-3 flex gap-2">{card.deck.topic && <Badge tone="brand">{card.deck.topic.name}</Badge>}<Badge tone="outline">{card.deck.title}</Badge></div>
          <div className="mt-6"><FlipCard front={card.front} back={card.back} explanation={card.explanation} topic={card.deck.topic?.name} size="lg" /></div>
          {card.explanation && <div className="card mt-6 p-5"><h2 className="font-semibold">Explanation</h2><p className="mt-1 text-sm text-ink/85">{card.explanation}</p></div>}
          <div className="mt-6 flex flex-wrap gap-3">
            {user ? <AddToDeck cardId={card.id} /> : <ButtonLink href="/login?next=/flashcards/daily" variant="secondary">Sign in to add to My Deck</ButtonLink>}
            <ButtonLink href={`/flashcards/${card.deck.slug}`} variant="secondary"><Layers className="h-4 w-4" /> Study the {card.deck.title} deck</ButtonLink>
            {card.lesson ? (
              <ButtonLink href={`/academy/courses/${card.lesson.module.course.slug}/lessons/${card.lesson.slug}`} variant="ghost"><BookOpen className="h-4 w-4" /> Related lesson</ButtonLink>
            ) : card.deck.topic && (
              <Link href={`/academy/courses?topic=${card.deck.topic.slug}`} className="inline-flex items-center gap-1.5 self-center text-sm font-semibold text-brand hover:underline"><BookOpen className="h-4 w-4" /> Related courses</Link>
            )}
          </div>
        </>
      ) : <EmptyState className="mt-8" title="No flashcards published yet" />}
    </div>
  );
}
