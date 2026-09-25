import { describe, expect, it } from "vitest";
import { initialSrsState, isDue, MASTERY_INTERVAL, MAX_INTERVAL, MIN_EASE, schedule } from "@/lib/srs";

const now = new Date("2026-01-10T12:00:00Z");
const DAY = 86400_000;

describe("spaced repetition scheduler", () => {
  it("first GOOD review schedules 1 day, second 3 days, then interval × ease", () => {
    const r1 = schedule(initialSrsState, "GOOD", now);
    expect(r1.intervalDays).toBe(1);
    expect(r1.nextReviewAt.getTime() - now.getTime()).toBe(DAY);
    const r2 = schedule(r1, "GOOD", now);
    expect(r2.intervalDays).toBe(3);
    const r3 = schedule(r2, "GOOD", now);
    expect(r3.intervalDays).toBe(Math.round(3 * 2.5));
    expect(r3.state).toBe("REVIEW");
  });
  it("AGAIN resets repetitions, increments lapses, lowers ease and re-queues within minutes", () => {
    const r = schedule({ ...initialSrsState, repetitions: 4, intervalDays: 20, easeFactor: 2.5 }, "AGAIN", now);
    expect(r.repetitions).toBe(0);
    expect(r.lapses).toBe(1);
    expect(r.easeFactor).toBe(2.3);
    expect(r.state).toBe("LEARNING");
    expect(r.nextReviewAt.getTime() - now.getTime()).toBe(10 * 60 * 1000);
  });
  it("EASY grows faster and raises ease; HARD grows slower and lowers ease", () => {
    const base = { ...initialSrsState, repetitions: 2, intervalDays: 3 };
    const easy = schedule(base, "EASY", now);
    const hard = schedule(base, "HARD", now);
    const good = schedule(base, "GOOD", now);
    expect(easy.intervalDays).toBeGreaterThan(good.intervalDays);
    expect(hard.intervalDays).toBeLessThan(good.intervalDays);
    expect(easy.easeFactor).toBeCloseTo(2.65);
    expect(hard.easeFactor).toBeCloseTo(2.35);
  });
  it("never lets ease fall below the minimum", () => {
    let s = { ...initialSrsState };
    for (let i = 0; i < 20; i++) s = schedule(s, "AGAIN", now);
    expect(s.easeFactor).toBe(MIN_EASE);
  });
  it("caps intervals and marks cards mastered at 21+ days", () => {
    let s = schedule(initialSrsState, "EASY", now);
    for (let i = 0; i < 10; i++) s = schedule(s, "EASY", now);
    expect(s.intervalDays).toBeLessThanOrEqual(MAX_INTERVAL);
    expect(s.intervalDays).toBeGreaterThanOrEqual(MASTERY_INTERVAL);
    expect(s.state).toBe("MASTERED");
  });
  it("isDue treats anything scheduled up to the end of today as due", () => {
    const local = new Date(2026, 0, 10, 9, 0, 0);
    expect(isDue(new Date(2026, 0, 10, 23, 0, 0), local)).toBe(true);
    expect(isDue(new Date(2026, 0, 11, 0, 30, 0), local)).toBe(false);
  });
});
