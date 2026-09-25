import { z } from "zod";
import { db } from "@/lib/db";
import { canAccessTopicContent, getEntitlements, type Entitlements } from "@/lib/entitlements";
import type { Role } from "@/lib/rbac";
import { initialSrsState, schedule, type CardRating } from "@/lib/srs";
import { dayKey, hashString, slugify } from "@/lib/utils";
import { AccessError, NotFoundError } from "./courses";

type Actor = { id: string; role: Role };

function endOfToday(now = new Date()) {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function deckAccessible(ent: Entitlements, deck: { accessTier: "FREE" | "PREMIUM"; ownerId: string | null; topic?: { slug: string } | null }, userId?: string) {
  if (deck.ownerId) return deck.ownerId === userId;
  return canAccessTopicContent(ent, { accessTier: deck.accessTier, topicSlug: deck.topic?.slug });
}

export async function listDecks(user: Actor | null, q?: string) {
  const ent = await getEntitlements(user);
  const decks = await db.flashcardDeck.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ ownerId: null }, ...(user ? [{ ownerId: user.id }] : [])],
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { cards: { some: { OR: [{ front: { contains: q, mode: "insensitive" as const } }, { back: { contains: q, mode: "insensitive" as const } }] } } }] } : {}),
    },
    include: { topic: true, _count: { select: { cards: true, collected: true } } },
    orderBy: [{ ownerId: "asc" }, { title: "asc" }],
  });
  let progress: Record<string, { reviewed: number; mastered: number; due: number }> = {};
  if (user) {
    const reviews = await db.flashcardReview.findMany({ where: { userId: user.id }, select: { state: true, nextReviewAt: true, flashcard: { select: { deckId: true } } } });
    const eod = endOfToday();
    progress = {};
    for (const r of reviews) {
      const p = (progress[r.flashcard.deckId] ??= { reviewed: 0, mastered: 0, due: 0 });
      p.reviewed++;
      if (r.state === "MASTERED") p.mastered++;
      if (r.nextReviewAt <= eod) p.due++;
    }
  }
  return decks.map((d) => ({ ...d, accessible: deckAccessible(ent, d, user?.id), progress: progress[d.id] ?? { reviewed: 0, mastered: 0, due: 0 } }));
}

async function deckCards(deckId: string) {
  const deck = await db.flashcardDeck.findUnique({ where: { id: deckId } });
  if (!deck) return [];
  if (deck.ownerId) {
    const [own, collected] = await Promise.all([
      db.flashcard.findMany({ where: { deckId, status: "PUBLISHED" }, orderBy: { order: "asc" } }),
      db.collectionItem.findMany({ where: { deckId }, include: { flashcard: true }, orderBy: { addedAt: "asc" } }),
    ]);
    return [...own, ...collected.map((c) => c.flashcard)];
  }
  return db.flashcard.findMany({ where: { deckId, status: "PUBLISHED" }, orderBy: { order: "asc" } });
}

export async function getDeckForStudy(user: Actor, slug: string) {
  const deck = await db.flashcardDeck.findUnique({ where: { slug }, include: { topic: true, owner: { select: { id: true } } } });
  if (!deck || deck.status !== "PUBLISHED") throw new NotFoundError("Deck not found");
  const ent = await getEntitlements(user);
  if (!deckAccessible(ent, deck, user.id)) throw new AccessError(deck.ownerId ? "This is another learner's private deck." : undefined);
  const cards = await deckCards(deck.id);
  const reviews = await db.flashcardReview.findMany({ where: { userId: user.id, flashcardId: { in: cards.map((c) => c.id) } } });
  const bookmarks = await db.bookmark.findMany({ where: { userId: user.id, entityType: "FLASHCARD", entityId: { in: cards.map((c) => c.id) } } });
  const rmap = new Map(reviews.map((r) => [r.flashcardId, r]));
  const bset = new Set(bookmarks.map((b) => b.entityId));
  return { deck, cards: cards.map((c) => ({ ...c, review: rmap.get(c.id) ?? null, bookmarked: bset.has(c.id) })) };
}

/** Cards due for the learner today across all accessible decks. */
export async function getDueCards(user: Actor, limit = 50) {
  const ent = await getEntitlements(user);
  const due = await db.flashcardReview.findMany({
    where: { userId: user.id, nextReviewAt: { lte: endOfToday() } },
    include: { flashcard: { include: { deck: { include: { topic: true } } } } },
    orderBy: { nextReviewAt: "asc" },
    take: limit * 2,
  });
  return due
    .filter((r) => deckAccessible(ent, r.flashcard.deck, user.id) || r.flashcard.deck.ownerId === user.id)
    .slice(0, limit)
    .map((r) => ({ ...r.flashcard, review: r, bookmarked: false }));
}

export async function rateCard(user: Actor, flashcardId: string, rating: CardRating, opts: { known?: boolean; now?: Date } = {}) {
  const card = await db.flashcard.findUnique({ where: { id: flashcardId }, include: { deck: { include: { topic: true } } } });
  if (!card) throw new NotFoundError("Card not found");
  const ent = await getEntitlements(user);
  const inCollection = await db.collectionItem.findFirst({ where: { flashcardId, deck: { ownerId: user.id } } });
  if (!deckAccessible(ent, card.deck, user.id) && !(inCollection && canAccessTopicContent(ent, { accessTier: card.deck.accessTier, topicSlug: card.deck.topic?.slug })))
    throw new AccessError();
  const now = opts.now ?? new Date();
  const prev = await db.flashcardReview.findUnique({ where: { userId_flashcardId: { userId: user.id, flashcardId } } });
  const next = schedule(prev ?? initialSrsState, rating, now);
  const known = opts.known ?? (rating === "AGAIN" ? false : prev?.known ?? false);
  const review = await db.flashcardReview.upsert({
    where: { userId_flashcardId: { userId: user.id, flashcardId } },
    update: { ...next, lastRating: rating, lastReviewedAt: now, known },
    create: { userId: user.id, flashcardId, ...next, lastRating: rating, lastReviewedAt: now, known },
  });
  await db.flashcardReviewLog.create({
    data: { userId: user.id, flashcardId, rating, intervalBefore: prev?.intervalDays ?? 0, intervalAfter: next.intervalDays, easeAfter: next.easeFactor, reviewedAt: now },
  });
  return review;
}

export async function flashcardStats(userId: string, now = new Date()) {
  const eod = endOfToday(now);
  const weekAhead = new Date(eod.getTime() + 7 * 86400_000);
  const [dueToday, upcoming, mastered, needsRevision, reviewedTotal] = await Promise.all([
    db.flashcardReview.count({ where: { userId, nextReviewAt: { lte: eod } } }),
    db.flashcardReview.count({ where: { userId, nextReviewAt: { gt: eod, lte: weekAhead } } }),
    db.flashcardReview.count({ where: { userId, state: "MASTERED" } }),
    db.flashcardReview.count({ where: { userId, OR: [{ lastRating: "AGAIN" }, { state: "LEARNING" }] } }),
    db.flashcardReview.count({ where: { userId } }),
  ]);
  return { dueToday, upcoming, mastered, needsRevision, reviewedTotal };
}

export async function upcomingSchedule(userId: string, days = 7) {
  const start = endOfToday();
  const reviews = await db.flashcardReview.findMany({ where: { userId, nextReviewAt: { gt: start, lte: new Date(start.getTime() + days * 86400_000) } }, select: { nextReviewAt: true } });
  const out: { day: string; count: number }[] = [];
  for (let i = 1; i <= days; i++) {
    const d = new Date(start.getTime() + i * 86400_000);
    out.push({ day: dayKey(d), count: 0 });
  }
  for (const r of reviews) {
    const k = dayKey(r.nextReviewAt);
    const slot = out.find((o) => o.day === k);
    if (slot) slot.count++;
  }
  return out;
}

/** Deterministic "Flashcard of the Day" from free, published official cards. */
export async function flashcardOfTheDay(date = new Date()) {
  const cards = await db.flashcard.findMany({
    where: { status: "PUBLISHED", deck: { ownerId: null, accessTier: "FREE", status: "PUBLISHED" } },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  if (!cards.length) return null;
  const pick = cards[hashString(`fotd:${dayKey(date)}`) % cards.length];
  return db.flashcard.findUnique({
    where: { id: pick.id },
    include: { deck: { include: { topic: true } }, lesson: { include: { module: { include: { course: { select: { slug: true, title: true } } } } } } },
  });
}

export async function getOrCreatePersonalDeck(userId: string) {
  const existing = await db.flashcardDeck.findFirst({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return db.flashcardDeck.create({
    data: { slug: `my-deck-${userId.slice(-8)}-${Date.now().toString(36)}`, title: "My Deck", description: "Your personal collection of flashcards.", ownerId: userId, accessTier: "FREE" },
  });
}

export const deckSchema = z.object({ title: z.string().trim().min(2).max(80), description: z.string().trim().max(300).optional().default("") });

export async function createPersonalDeck(userId: string, input: z.infer<typeof deckSchema>) {
  const data = deckSchema.parse(input);
  return db.flashcardDeck.create({
    data: { slug: `${slugify(data.title)}-${Date.now().toString(36)}`, title: data.title, description: data.description || "Personal collection", ownerId: userId, accessTier: "FREE" },
  });
}

export async function addToCollection(user: Actor, flashcardId: string, deckId?: string) {
  const card = await db.flashcard.findUnique({ where: { id: flashcardId }, include: { deck: { include: { topic: true } } } });
  if (!card) throw new NotFoundError("Card not found");
  const ent = await getEntitlements(user);
  if (!deckAccessible(ent, card.deck, user.id)) throw new AccessError();
  const deck = deckId ? await db.flashcardDeck.findFirst({ where: { id: deckId, ownerId: user.id } }) : await getOrCreatePersonalDeck(user.id);
  if (!deck) throw new AccessError("You can only add cards to your own decks.");
  if (card.deckId === deck.id) return deck;
  await db.collectionItem.upsert({ where: { deckId_flashcardId: { deckId: deck.id, flashcardId } }, update: {}, create: { deckId: deck.id, flashcardId } });
  return deck;
}

export const customCardSchema = z.object({
  deckId: z.string().min(1),
  front: z.string().trim().min(2, "Enter the question or term.").max(500),
  back: z.string().trim().min(1, "Enter the answer.").max(2000),
  explanation: z.string().trim().max(2000).optional(),
});

export async function createCustomCard(userId: string, input: z.infer<typeof customCardSchema>) {
  const data = customCardSchema.parse(input);
  const deck = await db.flashcardDeck.findFirst({ where: { id: data.deckId, ownerId: userId } });
  if (!deck) throw new AccessError("You can only add cards to your own decks.");
  const count = await db.flashcard.count({ where: { deckId: deck.id } });
  return db.flashcard.create({ data: { deckId: deck.id, front: data.front, back: data.back, explanation: data.explanation || null, order: count } });
}
