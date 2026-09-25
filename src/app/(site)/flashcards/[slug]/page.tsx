import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { AccessError, NotFoundError } from "@/server/services/courses";
import { getDeckForStudy } from "@/server/services/flashcards";
import { StudyDeck } from "@/components/flashcards/study-deck";
import { CreateCardForm } from "@/components/flashcards/deck-forms";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = await db.flashcardDeck.findUnique({ where: { slug: (await params).slug }, select: { title: true, description: true, ownerId: true } });
  return d ? { title: `${d.title} flashcards`, description: d.description, robots: d.ownerId ? { index: false } : undefined } : { title: "Deck not found" };
}

export default async function DeckPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    const deck = await db.flashcardDeck.findUnique({ where: { slug }, include: { _count: { select: { cards: true } }, cards: { take: 3, orderBy: { order: "asc" } } } });
    if (!deck || deck.ownerId || deck.status !== "PUBLISHED") notFound();
    return (
      <div className="container max-w-3xl py-12">
        <h1 className="text-3xl font-bold">{deck.title}</h1>
        <p className="mt-2 text-muted">{deck.description} · {deck._count.cards} cards</p>
        <ul className="mt-6 space-y-2">{deck.cards.map((c) => <li key={c.id} className="card p-4 font-medium">{c.front}</li>)}</ul>
        <ButtonLink href={`/login?next=/flashcards/${slug}`} className="mt-6">Sign in to study and track progress</ButtonLink>
      </div>
    );
  }
  let data;
  try {
    data = await getDeckForStudy(user, slug);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    if (e instanceof AccessError) {
      if (e.message.includes("private")) notFound();
      return (
        <div className="container max-w-xl py-16 text-center">
          <Lock className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-2xl font-bold">Premium deck</h1>
          <p className="mt-2 text-muted">{e.message}</p>
          <ButtonLink href="/pricing" className="mt-6">View plans</ButtonLink>
        </div>
      );
    }
    throw e;
  }
  if (!data) redirect("/flashcards");
  const isOwn = data.deck.ownerId === user.id;
  return (
    <div className="container max-w-5xl py-10">
      <Link href="/flashcards" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Flashcard Library</Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">{data.deck.topic && <Badge tone="brand">{data.deck.topic.name}</Badge>}{isOwn && <Badge tone="gold">Personal deck</Badge>}</div>
      <h1 className="mt-2 text-3xl font-bold">{data.deck.title}</h1>
      <p className="mt-1 text-muted">{data.deck.description}</p>
      <div className={isOwn ? "mt-8 grid gap-8 lg:grid-cols-[1fr_320px]" : "mt-8"}>
        <StudyDeck isOwn={isOwn} cards={data.cards.map((c) => ({ id: c.id, front: c.front, back: c.back, explanation: c.explanation, deckTitle: data.deck.title, bookmarked: c.bookmarked, review: c.review ? { state: c.review.state, intervalDays: c.review.intervalDays, nextReviewAt: c.review.nextReviewAt.toISOString(), known: c.review.known, lastRating: c.review.lastRating } : null }))} />
        {isOwn && <aside className="card self-start p-5"><h2 className="mb-3 font-semibold">Add a custom card</h2><CreateCardForm deckId={data.deck.id} /></aside>}
      </div>
    </div>
  );
}
