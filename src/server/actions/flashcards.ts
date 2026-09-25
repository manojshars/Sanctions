"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, requireActionUser } from "@/lib/auth/session";
import { AccessError, NotFoundError } from "@/server/services/courses";
import { addToCollection, createCustomCard, createPersonalDeck, rateCard } from "@/server/services/flashcards";
import type { ActionState } from "@/server/action-types";
import type { CardRating } from "@/lib/srs";
import { ZodError } from "zod";

const RATINGS: CardRating[] = ["AGAIN", "HARD", "GOOD", "EASY"];

export async function rateCardAction(flashcardId: string, rating: CardRating, known?: boolean) {
  const user = await requireActionUser();
  if (!RATINGS.includes(rating)) return { ok: false as const, error: "Invalid rating" };
  try {
    const r = await rateCard(user, flashcardId, rating, { known });
    return { ok: true as const, nextReviewAt: r.nextReviewAt.toISOString(), intervalDays: r.intervalDays, state: r.state, known: r.known };
  } catch (e) {
    if (e instanceof AccessError || e instanceof NotFoundError) return { ok: false as const, error: e.message };
    throw e;
  }
}

export async function addToDeckAction(flashcardId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/flashcards/daily");
  try {
    const deck = await addToCollection(user, flashcardId);
    return { ok: true as const, deckSlug: deck.slug, deckTitle: deck.title };
  } catch (e) {
    if (e instanceof AccessError || e instanceof NotFoundError) return { ok: false as const, error: e.message };
    throw e;
  }
}

export async function createDeckAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireActionUser();
  let slug: string;
  try {
    slug = (await createPersonalDeck(user.id, { title: String(form.get("title") ?? ""), description: String(form.get("description") ?? "") })).slug;
  } catch (e) {
    if (e instanceof ZodError) return { error: "Enter a deck title (2–80 characters)." };
    throw e;
  }
  redirect(`/flashcards/${slug}`);
}

export async function createCardAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireActionUser();
  try {
    await createCustomCard(user.id, {
      deckId: String(form.get("deckId") ?? ""), front: String(form.get("front") ?? ""), back: String(form.get("back") ?? ""),
      explanation: String(form.get("explanation") ?? "") || undefined,
    });
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "Invalid card" };
    if (e instanceof AccessError) return { error: e.message };
    throw e;
  }
  revalidatePath("/flashcards");
  return { ok: true, message: "Card added." };
}
