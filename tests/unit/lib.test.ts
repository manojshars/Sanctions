import { describe, expect, it } from "vitest";
import { parseCsv, parseCsvObjects } from "@/lib/csv";
import { isValidYouTubeId, parseYouTubeId, fetchOEmbed } from "@/lib/youtube";
import { can, isStaff, PERMISSIONS } from "@/lib/rbac";
import { passwordIssues, hashPassword, verifyPassword } from "@/lib/auth/password";
import { questionContentHash } from "@/lib/question-hash";
import { hashString, shuffle, slugify } from "@/lib/utils";
import { allowedTiers, canAccessCourse, hasFeature, type Entitlements } from "@/lib/entitlements";
import { computeDiscount } from "@/server/services/payments";
import { generateVerificationCode, generateCertificateNumber } from "@/server/services/certificates";
import { questionShapeIssues, type QuestionInput } from "@/server/services/admin/questions";
import { gradeSimulation, publicSimulation, type Simulation } from "@/server/services/cases";
import { validateUpload, UploadError } from "@/lib/storage";

describe("CSV parser", () => {
  it("handles quotes, escaped quotes, commas and newlines", () => {
    expect(parseCsv('a,b\n"x, y","he said ""hi"""\n"multi\nline",z')).toEqual([["a", "b"], ["x, y", 'he said "hi"'], ["multi\nline", "z"]]);
  });
  it("maps header rows to objects and strips BOM", () => {
    expect(parseCsvObjects("﻿Topic,Type\nsanctions,SINGLE\n")).toEqual([{ topic: "sanctions", type: "SINGLE" }]);
  });
});

describe("YouTube helpers", () => {
  it("parses common URL formats", () => {
    for (const u of ["dQw4w9WgXcQ", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1", "https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ", "https://m.youtube.com/shorts/dQw4w9WgXcQ"])
      expect(parseYouTubeId(u)).toBe("dQw4w9WgXcQ");
  });
  it("rejects invalid IDs and foreign hosts", () => {
    expect(parseYouTubeId("https://evil.example/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeId("short")).toBeNull();
    expect(isValidYouTubeId("dQw4w9WgXc<")).toBe(false);
  });
  it("interprets oEmbed responses without network", async () => {
    const ok = (await fetchOEmbed("dQw4w9WgXcQ", async () => new Response(JSON.stringify({ title: "T", author_name: "C" }), { status: 200 }))) ;
    expect(ok).toMatchObject({ reachable: true, exists: true, title: "T", authorName: "C" });
    expect((await fetchOEmbed("dQw4w9WgXcQ", async () => new Response("", { status: 404 }))).exists).toBe(false);
    expect((await fetchOEmbed("dQw4w9WgXcQ", async () => { throw new Error("blocked"); })).reachable).toBe(false);
  });
});

describe("RBAC", () => {
  it("grants permissions by role", () => {
    expect(can("ADMIN", "users:manage")).toBe(true);
    expect(can("EDITOR", "users:manage")).toBe(false);
    expect(can("EDITOR", "content:manage")).toBe(true);
    expect(can("SUPPORT", "support:manage")).toBe(true);
    expect(can("SUPPORT", "content:manage")).toBe(false);
    expect(can("LEARNER", "admin:access")).toBe(false);
    expect(can(null, "admin:access")).toBe(false);
  });
  it("only ADMIN can view revenue and audit logs", () => {
    expect(PERMISSIONS["revenue:view"]).toEqual(["ADMIN"]);
    expect(PERMISSIONS["audit:view"]).toEqual(["ADMIN"]);
    expect(isStaff("SUPPORT")).toBe(true);
  });
});

describe("passwords", () => {
  it("enforces the policy", () => {
    expect(passwordIssues("short1")).not.toHaveLength(0);
    expect(passwordIssues("longpassword")).toContain("Include at least one number.");
    expect(passwordIssues("Longpassword1")).toHaveLength(0);
  });
  it("hashes and verifies", async () => {
    const h = await hashPassword("Correct horse 1");
    expect(h).not.toContain("Correct");
    expect(await verifyPassword("Correct horse 1", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
  });
});

describe("utilities", () => {
  it("content hash ignores option order and formatting", () => {
    expect(questionContentHash("What is X?", ["A", "B"])).toBe(questionContentHash("  what is x ", ["b", "a"]));
    expect(questionContentHash("What is X?", ["A", "B"])).not.toBe(questionContentHash("What is Y?", ["A", "B"]));
  });
  it("slugify, hashString and shuffle", () => {
    expect(slugify("OFAC 50% Rule — Ownership!")).toBe("ofac-50-rule-ownership");
    expect(hashString("a")).toBe(hashString("a"));
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr).sort()).toEqual(arr);
  });
});

describe("entitlement helpers", () => {
  const base: Entitlements = { tier: "FREE", allAccess: false, topicSlugs: new Set(), courseIds: new Set(), features: new Set(), packageNames: [] };
  it("free users access only free content", () => {
    expect(canAccessCourse(base, { id: "c1", accessTier: "FREE", topicSlug: "aml-ctf" })).toBe(true);
    expect(canAccessCourse(base, { id: "c2", accessTier: "PREMIUM", topicSlug: "aml-ctf" })).toBe(false);
    expect(allowedTiers(base)).toEqual(["FREE"]);
  });
  it("packages grant topic-scoped access and features", () => {
    const pkg: Entitlements = { ...base, tier: "PREMIUM", topicSlugs: new Set(["sanctions"]), features: new Set(["MOCK_EXAMS"]) };
    expect(canAccessCourse(pkg, { id: "c", accessTier: "PREMIUM", topicSlug: "sanctions" })).toBe(true);
    expect(canAccessCourse(pkg, { id: "c", accessTier: "PREMIUM", topicSlug: "fraud" })).toBe(false);
    expect(hasFeature(pkg, "MOCK_EXAMS")).toBe(true);
    expect(hasFeature(pkg, "MOCK_EXAMS", "fraud")).toBe(false);
    expect(allowedTiers(pkg, "sanctions")).toEqual(["FREE", "PREMIUM"]);
  });
  it("corporate assignments unlock specific courses", () => {
    expect(canAccessCourse({ ...base, courseIds: new Set(["c9"]) }, { id: "c9", accessTier: "PREMIUM", topicSlug: "fraud" })).toBe(true);
  });
});

describe("pricing", () => {
  it("applies coupons then fee assistance and never goes negative", () => {
    expect(computeDiscount(10000, { percentOff: 20 })).toEqual({ discountCents: 2000, totalCents: 8000 });
    expect(computeDiscount(10000, { percentOff: 20, assistancePct: 50 })).toEqual({ discountCents: 6000, totalCents: 4000 });
    expect(computeDiscount(1000, { amountOffCents: 5000 })).toEqual({ discountCents: 1000, totalCents: 0 });
  });
});

describe("certificates", () => {
  it("generates well-formed numbers and verification codes", () => {
    expect(generateCertificateNumber(new Date("2026-02-01"))).toMatch(/^FCA-2026-[0-9A-F]{8}$/);
    const code = generateVerificationCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(code).not.toMatch(/[01IO]/);
  });
});

describe("question validation", () => {
  const base: QuestionInput = { topicId: "t", type: "SINGLE", difficulty: "BEGINNER", stem: "A sufficiently long stem?", explanation: "Because of reasons.", tags: [], accessTier: "FREE", options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }], acceptedAnswers: [], keywords: [] };
  it("accepts a valid single-answer question", () => expect(questionShapeIssues(base)).toEqual([]));
  it("requires exactly one correct option for single answer", () => expect(questionShapeIssues({ ...base, options: base.options.map((o) => ({ ...o, isCorrect: true })) })).not.toEqual([]));
  it("requires accepted answers for fill-in-the-blank", () => expect(questionShapeIssues({ ...base, type: "FILL_BLANK", options: [] })).toContain("Add at least one accepted answer."));
  it("requires matching values for matching questions", () => expect(questionShapeIssues({ ...base, type: "MATCHING", options: [{ text: "x", isCorrect: true }, { text: "y", isCorrect: true, matchText: "z" }] })).toContain("Every matching item needs a matching value."));
  it("requires a model answer for short answers", () => expect(questionShapeIssues({ ...base, type: "SHORT_ANSWER", options: [], keywords: ["a"] })).toContain("Add a model answer."));
});

describe("case simulation grading", () => {
  const sim: Simulation = {
    documents: [], modelReasoning: "because",
    steps: [
      { id: "s1", kind: "indicators", prompt: "p", multi: true, options: [{ id: "a", text: "A", correct: true, feedback: "" }, { id: "b", text: "B", correct: true, feedback: "" }, { id: "c", text: "C", correct: false, feedback: "" }] },
      { id: "s2", kind: "recommendation", prompt: "p", multi: false, options: [{ id: "a", text: "A", correct: false, feedback: "" }, { id: "b", text: "B", correct: true, feedback: "" }] },
    ],
  };
  it("scores steps with penalties for wrong picks", () => {
    expect(gradeSimulation(sim, { s1: ["a", "b"], s2: ["b"] }).total).toBe(100);
    expect(gradeSimulation(sim, { s1: ["a", "c"], s2: ["b"] }).total).toBe(50);
    expect(gradeSimulation(sim, {}).total).toBe(0);
  });
  it("strips correctness from the public view", () => {
    expect(JSON.stringify(publicSimulation(sim))).not.toContain("correct");
  });
});

describe("upload validation", () => {
  it("accepts matching magic bytes and rejects spoofed types", () => {
    expect(validateUpload("a.png", "image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1])).ext).toBe("png");
    expect(() => validateUpload("a.png", "image/png", new Uint8Array([1, 2, 3]))).toThrow(UploadError);
    expect(() => validateUpload("a.exe", "application/x-msdownload", new Uint8Array([1]))).toThrow(UploadError);
    expect(() => validateUpload("big.txt", "text/plain", new Uint8Array(6 * 1024 * 1024).fill(65))).toThrow(/5 MB/);
    expect(validateUpload("../../etc/passwd.txt", "text/plain", new TextEncoder().encode("hi")).safeName).not.toContain("/");
  });
});
