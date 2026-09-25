# Spaced repetition & scoring rules

## Scheduler (`src/lib/srs.ts`) — SM-2 variant

| Button | Rating | Effect |
|---|---|---|
| Needs revision | AGAIN | repetitions → 0, lapses +1, ease −0.20, due again in **10 minutes** (state LEARNING) |
| Difficult | HARD | interval 1 day on first success, else max(interval+1, interval×1.2); ease −0.15 |
| Medium | GOOD | 1 day, then 3 days, then interval × ease |
| Easy / Mark as known | EASY | 4 days on first success, else interval × ease × 1.3; ease +0.15 |

Ease is clamped to 1.3–3.0, intervals capped at 365 days. A card is **MASTERED** once its interval
reaches 21 days. Every rating is logged in `FlashcardReviewLog`; the current schedule lives in
`FlashcardReview` (ease, interval, repetitions, lapses, last/next review, known flag).
Dashboard counts: *Due today* (next review ≤ end of today), *Upcoming* (next 7 days),
*Mastered*, *Needs revision* (last rating AGAIN or state LEARNING). The Flashcard of the Day is chosen
deterministically from free published cards by hashing the date.

## Question scoring (`src/lib/scoring.ts`)
- Single / true-false / scenario: exactly one selected, and correct.
- Multiple-select / investigation: **all-or-nothing** — the selected set must equal the correct set
  (partial credit is computed for feedback only).
- Matching: every pair must match (case/punctuation-insensitive).
- Fill-in-the-blank: normalised answer equals an accepted answer.
- Short answer: equals an accepted answer, or contains every keyword group (`a|b` alternatives,
  whole-word). Learners always see the model answer.
- Unanswered = incorrect. Score = round(correct / total × 100). Pass/fail uses the assessment's pass mark.
- Case simulations: each step scores (correct picks − wrong picks) / correct options, floored at 0;
  total is the mean.
