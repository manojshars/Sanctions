import { describe, expect, it } from "vitest";
import { gradeQuestion, isAnswered, normalizeText, scorePercent, topicBreakdown, type GradableQuestion } from "@/lib/scoring";

const single: GradableQuestion = { type: "SINGLE", options: [{ id: "a", isCorrect: false }, { id: "b", isCorrect: true }, { id: "c", isCorrect: false }] };
const multi: GradableQuestion = { type: "MULTIPLE", options: [{ id: "a", isCorrect: true }, { id: "b", isCorrect: true }, { id: "c", isCorrect: false }, { id: "d", isCorrect: false }] };

describe("single-answer scoring", () => {
  it("marks the correct option correct", () => expect(gradeQuestion(single, { selected: ["b"] }).correct).toBe(true));
  it("marks a wrong option incorrect", () => expect(gradeQuestion(single, { selected: ["a"] }).correct).toBe(false));
  it("rejects multiple selections for single-answer questions", () => expect(gradeQuestion(single, { selected: ["a", "b"] }).correct).toBe(false));
  it("treats no answer as unanswered and incorrect", () => {
    const g = gradeQuestion(single, { selected: [] });
    expect(g).toEqual({ correct: false, partial: 0, answered: false });
    expect(gradeQuestion(single, null).answered).toBe(false);
  });
  it("applies to true/false and scenario types", () => {
    expect(gradeQuestion({ ...single, type: "TRUE_FALSE" }, { selected: ["b"] }).correct).toBe(true);
    expect(gradeQuestion({ ...single, type: "SCENARIO" }, { selected: ["c"] }).correct).toBe(false);
  });
});

describe("multiple-select scoring (all-or-nothing)", () => {
  it("is correct only when exactly the correct set is selected", () => expect(gradeQuestion(multi, { selected: ["b", "a"] }).correct).toBe(true));
  it("is incorrect when a correct option is missing", () => {
    const g = gradeQuestion(multi, { selected: ["a"] });
    expect(g.correct).toBe(false);
    expect(g.partial).toBeCloseTo(0.5);
  });
  it("is incorrect when an extra wrong option is selected", () => {
    const g = gradeQuestion(multi, { selected: ["a", "b", "c"] });
    expect(g.correct).toBe(false);
    expect(g.partial).toBeCloseTo(0.5);
  });
  it("ignores duplicate and unknown option ids", () => {
    expect(gradeQuestion(multi, { selected: ["a", "a", "b", "zzz"] }).correct).toBe(true);
  });
  it("selecting everything is not correct", () => expect(gradeQuestion(multi, { selected: ["a", "b", "c", "d"] }).correct).toBe(false));
  it("investigation questions use the same rule", () => expect(gradeQuestion({ ...multi, type: "INVESTIGATION" }, { selected: ["a", "b"] }).correct).toBe(true));
});

describe("matching, fill-in-the-blank and short answer", () => {
  const matching: GradableQuestion = { type: "MATCHING", options: [{ id: "1", isCorrect: true, matchText: "Placement" }, { id: "2", isCorrect: true, matchText: "Layering" }] };
  it("requires every pair to match (case/punctuation-insensitive)", () => {
    expect(gradeQuestion(matching, { matches: { "1": "placement", "2": "Layering." } }).correct).toBe(true);
    const g = gradeQuestion(matching, { matches: { "1": "Layering", "2": "Layering" } });
    expect(g.correct).toBe(false);
    expect(g.partial).toBe(0.5);
  });
  it("fill-in-the-blank accepts any accepted answer, normalised", () => {
    const q: GradableQuestion = { type: "FILL_BLANK", options: [], acceptedAnswers: ["structuring", "smurfing"] };
    expect(gradeQuestion(q, { text: "  Smurfing " }).correct).toBe(true);
    expect(gradeQuestion(q, { text: "layering" }).correct).toBe(false);
  });
  it("short answer requires every keyword group", () => {
    const q: GradableQuestion = { type: "SHORT_ANSWER", options: [], keywords: ["baseline|expected|profile", "monitor|monitoring|unusual"] };
    expect(gradeQuestion(q, { text: "It sets the expected profile so monitoring can detect unusual activity." }).correct).toBe(true);
    const partial = gradeQuestion(q, { text: "It sets the expected profile." });
    expect(partial.correct).toBe(false);
    expect(partial.partial).toBe(0.5);
  });
  it("short answer keywords match whole words only", () => {
    const q: GradableQuestion = { type: "SHORT_ANSWER", options: [], keywords: ["who", "what"] };
    expect(gradeQuestion(q, { text: "whoever whatever" }).correct).toBe(false);
    expect(gradeQuestion(q, { text: "who and what" }).correct).toBe(true);
  });
});

describe("helpers", () => {
  it("normalises text", () => expect(normalizeText("  Ôwnership — 50%! ")).toBe("ownership 50%"));
  it("computes percentages safely", () => {
    expect(scorePercent(7, 10)).toBe(70);
    expect(scorePercent(1, 3)).toBe(33);
    expect(scorePercent(0, 0)).toBe(0);
  });
  it("builds a topic breakdown", () => {
    const b = topicBreakdown([{ topic: "a", correct: true }, { topic: "a", correct: false }, { topic: "b", correct: true }]);
    expect(b).toEqual([{ topic: "a", correct: 1, total: 2, accuracy: 50 }, { topic: "b", correct: 1, total: 1, accuracy: 100 }]);
  });
  it("detects answered state per type", () => {
    expect(isAnswered({ type: "FILL_BLANK", options: [] }, { text: " " })).toBe(false);
    expect(isAnswered({ type: "MATCHING", options: [] }, { matches: { x: "y" } })).toBe(true);
  });
});
