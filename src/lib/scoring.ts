/**
 * Question scoring — pure functions, shared by practice, mock exams, readiness and final assessments.
 * All grading happens on the server; answer keys are never sent to the client before submission.
 *
 * Rules:
 *  - SINGLE / TRUE_FALSE / SCENARIO: exactly one option selected and it is the correct option.
 *  - MULTIPLE / INVESTIGATION: all-or-nothing — selected set must equal the set of correct options.
 *    (Partial credit is reported separately for feedback but does not count as correct.)
 *  - MATCHING: every left-hand item must be paired with its correct right-hand value.
 *  - FILL_BLANK: normalised response must equal one of the accepted answers.
 *  - SHORT_ANSWER: correct if it equals an accepted answer, or contains every keyword group
 *    (a group is "a|b|c" — any alternative satisfies it). Learners always see the model answer.
 */

export type QuestionType =
  | "SINGLE"
  | "MULTIPLE"
  | "TRUE_FALSE"
  | "SCENARIO"
  | "MATCHING"
  | "FILL_BLANK"
  | "SHORT_ANSWER"
  | "INVESTIGATION";

export interface GradableOption {
  id: string;
  isCorrect: boolean;
  matchText?: string | null;
}

export interface GradableQuestion {
  type: QuestionType;
  options: GradableOption[];
  acceptedAnswers?: string[];
  keywords?: string[];
}

export interface QuestionResponse {
  selected?: string[];
  text?: string;
  matches?: Record<string, string>;
}

export interface GradeResult {
  correct: boolean;
  /** 0..1 — informational partial credit */
  partial: number;
  answered: boolean;
}

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function isAnswered(q: GradableQuestion, r: QuestionResponse | null | undefined): boolean {
  if (!r) return false;
  switch (q.type) {
    case "MATCHING":
      return !!r.matches && Object.values(r.matches).some((v) => v && v.trim() !== "");
    case "FILL_BLANK":
    case "SHORT_ANSWER":
      return !!r.text && r.text.trim() !== "";
    default:
      return !!r.selected && r.selected.length > 0;
  }
}

export function gradeQuestion(q: GradableQuestion, r: QuestionResponse | null | undefined): GradeResult {
  if (!isAnswered(q, r) || !r) return { correct: false, partial: 0, answered: false };

  switch (q.type) {
    case "SINGLE":
    case "TRUE_FALSE":
    case "SCENARIO": {
      const correct = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      const sel = uniq(r.selected ?? []);
      const ok = sel.length === 1 && correct.length >= 1 && correct.includes(sel[0]);
      return { correct: ok, partial: ok ? 1 : 0, answered: true };
    }
    case "MULTIPLE":
    case "INVESTIGATION": {
      const valid = new Set(q.options.map((o) => o.id));
      const correct = new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id));
      const sel = new Set(uniq(r.selected ?? []).filter((id) => valid.has(id)));
      let hits = 0;
      let wrong = 0;
      for (const id of sel) (correct.has(id) ? hits++ : wrong++);
      const ok = correct.size > 0 && hits === correct.size && wrong === 0;
      const partial = correct.size ? Math.max(0, (hits - wrong) / correct.size) : 0;
      return { correct: ok, partial: ok ? 1 : Math.min(partial, 0.99), answered: true };
    }
    case "MATCHING": {
      const pairs = q.options.filter((o) => o.matchText);
      if (!pairs.length) return { correct: false, partial: 0, answered: true };
      const m = r.matches ?? {};
      const hits = pairs.filter((o) => normalizeText(m[o.id] ?? "") === normalizeText(o.matchText ?? "")).length;
      return { correct: hits === pairs.length, partial: hits / pairs.length, answered: true };
    }
    case "FILL_BLANK": {
      const answer = normalizeText(r.text ?? "");
      const ok = (q.acceptedAnswers ?? []).some((a) => normalizeText(a) === answer);
      return { correct: ok, partial: ok ? 1 : 0, answered: true };
    }
    case "SHORT_ANSWER": {
      const answer = normalizeText(r.text ?? "");
      if ((q.acceptedAnswers ?? []).some((a) => normalizeText(a) === answer)) {
        return { correct: true, partial: 1, answered: true };
      }
      const groups = (q.keywords ?? []).filter(Boolean);
      if (!groups.length) return { correct: false, partial: 0, answered: true };
      const padded = ` ${answer} `;
      const hits = groups.filter((g) =>
        g.split("|").some((alt) => {
          const n = normalizeText(alt);
          return n && padded.includes(` ${n} `);
        }),
      ).length;
      return { correct: hits === groups.length, partial: hits / groups.length, answered: true };
    }
    default:
      return { correct: false, partial: 0, answered: true };
  }
}

export function scorePercent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

export interface TopicStat {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
}

export function topicBreakdown(items: { topic: string; correct: boolean }[]): TopicStat[] {
  const map = new Map<string, { correct: number; total: number }>();
  for (const it of items) {
    const cur = map.get(it.topic) ?? { correct: 0, total: 0 };
    cur.total++;
    if (it.correct) cur.correct++;
    map.set(it.topic, cur);
  }
  return [...map.entries()]
    .map(([topic, v]) => ({ topic, ...v, accuracy: scorePercent(v.correct, v.total) }))
    .sort((a, b) => b.total - a.total);
}

function uniq<T>(a: T[]): T[] {
  return [...new Set(a)];
}
