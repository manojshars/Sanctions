/**
 * Spaced-repetition scheduler — a documented variant of SM-2 (see docs/SPACED_REPETITION.md).
 *
 * Learner buttons map to ratings:
 *   "Needs revision" → AGAIN, "Difficult" → HARD, "Medium" → GOOD, "Easy"/"Known" → EASY
 *
 *  AGAIN : repetitions reset to 0, lapses+1, ease −0.20, card re-queued in 10 minutes (same day).
 *  HARD  : interval = 1 day on first success, otherwise max(interval+1, interval × 1.2); ease −0.15.
 *  GOOD  : interval = 1 day, then 3 days, then interval × ease.
 *  EASY  : interval = 4 days on first success, otherwise interval × ease × 1.3; ease +0.15.
 *  Ease is clamped to [1.3, 3.0]; intervals are capped at 365 days.
 *  State: NEW → LEARNING (after AGAIN) → REVIEW → MASTERED once interval ≥ 21 days.
 */

export type CardRating = "AGAIN" | "HARD" | "GOOD" | "EASY";
export type CardState = "NEW" | "LEARNING" | "REVIEW" | "MASTERED";

export interface SrsState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  state: CardState;
}

export interface SrsResult extends SrsState {
  nextReviewAt: Date;
}

export const MIN_EASE = 1.3;
export const MAX_EASE = 3.0;
export const MAX_INTERVAL = 365;
export const MASTERY_INTERVAL = 21;
const DAY = 24 * 60 * 60 * 1000;

export const initialSrsState: SrsState = {
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
  lapses: 0,
  state: "NEW",
};

const clampEase = (e: number) => Math.round(Math.min(MAX_EASE, Math.max(MIN_EASE, e)) * 100) / 100;

export function schedule(prev: SrsState, rating: CardRating, now: Date = new Date()): SrsResult {
  let { easeFactor, intervalDays, repetitions, lapses } = prev;

  if (rating === "AGAIN") {
    return {
      easeFactor: clampEase(easeFactor - 0.2),
      intervalDays: 0,
      repetitions: 0,
      lapses: lapses + 1,
      state: "LEARNING",
      nextReviewAt: new Date(now.getTime() + 10 * 60 * 1000),
    };
  }

  if (rating === "HARD") {
    intervalDays = repetitions === 0 ? 1 : Math.max(intervalDays + 1, Math.round(intervalDays * 1.2));
    easeFactor = clampEase(easeFactor - 0.15);
  } else if (rating === "GOOD") {
    intervalDays = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.round(intervalDays * easeFactor);
  } else {
    intervalDays = repetitions === 0 ? 4 : Math.round(Math.max(intervalDays, 1) * easeFactor * 1.3);
    easeFactor = clampEase(easeFactor + 0.15);
  }

  intervalDays = Math.min(MAX_INTERVAL, Math.max(1, intervalDays));
  repetitions += 1;

  return {
    easeFactor,
    intervalDays,
    repetitions,
    lapses,
    state: intervalDays >= MASTERY_INTERVAL ? "MASTERED" : "REVIEW",
    nextReviewAt: new Date(now.getTime() + intervalDays * DAY),
  };
}

export function isDue(nextReviewAt: Date, now: Date = new Date()): boolean {
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return nextReviewAt.getTime() <= endOfDay.getTime();
}
