import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { makeUser } from "../helpers";
import { AuthorizationError } from "@/lib/rbac";
import { createQuestion, importQuestionsCsv, QuestionValidationError, transitionQuestion, updateQuestion } from "@/server/services/admin/questions";
import { AdminInputError, saveCourse, saveLesson, saveModule, saveVideo, setCourseStatus, saveDeck, saveCard, saveKnowledge, saveCaseStudy } from "@/server/services/admin/content";
import { grantMembership, setUserRole, setUserStatus } from "@/server/services/admin/users";
import { platformAnalytics } from "@/server/services/admin/analytics";
import { getEntitlements } from "@/lib/entitlements";

const topicId = async (slug = "sanctions") => (await db.topic.findUniqueOrThrow({ where: { slug } })).id;
const uniq = () => Math.random().toString(36).slice(2, 8);

function q(topic: string, stem: string) {
  return {
    topicId: topic, type: "SINGLE", difficulty: "BEGINNER", stem, explanation: "Because this is the right answer.", accessTier: "FREE",
    options: [{ text: "Right", isCorrect: true }, { text: "Wrong", isCorrect: false }, { text: "Also wrong", isCorrect: false }],
  };
}

describe("admin permissions", () => {
  it("learners and support staff cannot manage content; editors cannot manage users", async () => {
    const learner = await makeUser();
    const support = await makeUser({ role: "SUPPORT" });
    const editor = await makeUser({ role: "EDITOR" });
    const t = await topicId();
    await expect(createQuestion(learner, q(t, `Learner question ${uniq()}?`))).rejects.toBeInstanceOf(AuthorizationError);
    await expect(createQuestion(support, q(t, `Support question ${uniq()}?`))).rejects.toBeInstanceOf(AuthorizationError);
    await expect(setUserRole(editor, learner.id, "ADMIN")).rejects.toBeInstanceOf(AuthorizationError);
    await expect(grantMembership(editor, learner.id, { kind: "plan", slug: "premium-annual" })).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("admins manage roles, status and memberships but never their own role; changes are audited", async () => {
    const admin = await makeUser({ role: "ADMIN" });
    const u = await makeUser();
    await setUserRole(admin, u.id, "EDITOR");
    expect((await db.user.findUniqueOrThrow({ where: { id: u.id } })).role).toBe("EDITOR");
    await expect(setUserRole(admin, admin.id, "LEARNER")).rejects.toBeInstanceOf(AdminInputError);
    await setUserStatus(admin, u.id, "SUSPENDED");
    expect((await db.user.findUniqueOrThrow({ where: { id: u.id } })).status).toBe("SUSPENDED");
    const l = await makeUser();
    await grantMembership(admin, l.id, { kind: "plan", slug: "premium-annual", days: 30 });
    expect((await getEntitlements(l)).allAccess).toBe(true);
    expect(await db.auditLog.count({ where: { actorId: admin.id } })).toBeGreaterThanOrEqual(3);
  });
});

describe("question management", () => {
  it("creates drafts, detects duplicates, versions edits and runs the review workflow", async () => {
    const editor = await makeUser({ role: "EDITOR" });
    const t = await topicId();
    const stem = `Which authority maintains list ${uniq()}?`;
    const created = await createQuestion(editor, q(t, stem));
    expect(created.status).toBe("DRAFT");
    await expect(createQuestion(editor, q(t, stem))).rejects.toBeInstanceOf(QuestionValidationError);
    await expect(createQuestion(editor, { ...q(t, `Bad ${uniq()} question?`), options: [{ text: "A", isCorrect: false }, { text: "B", isCorrect: false }] })).rejects.toThrow(/exactly one/);

    const updated = await updateQuestion(editor, created.id, { ...q(t, `${stem} (revised)`), difficulty: "INTERMEDIATE" }, "Clarified stem");
    expect(updated.version).toBe(2);
    expect(await db.questionVersion.count({ where: { questionId: created.id } })).toBe(2);
    expect(await db.answerOption.count({ where: { questionId: created.id } })).toBe(3);

    await transitionQuestion(editor, created.id, "IN_REVIEW");
    const pub = await transitionQuestion(editor, created.id, "PUBLISHED");
    expect(pub.status).toBe("PUBLISHED");
    expect(pub.reviewedById).toBe(editor.id);
    await expect(transitionQuestion(editor, created.id, "IN_REVIEW")).rejects.toBeInstanceOf(QuestionValidationError);
    await transitionQuestion(editor, created.id, "DRAFT"); // unpublish
    await transitionQuestion(editor, created.id, "ARCHIVED");
  });

  it("imports questions from CSV with per-row errors and duplicate skipping", async () => {
    const editor = await makeUser({ role: "EDITOR" });
    const id = uniq();
    const csv = [
      "topic,type,difficulty,stem,options,correct,explanation,tags,access_tier,accepted_answers,matches",
      `sanctions,SINGLE,BEGINNER,"Import test ${id}: which is correct?","One|Two|Three",B,"Two is correct.",import|test,FREE,,`,
      `aml-ctf,MULTIPLE,INTERMEDIATE,"Import test ${id}: select two","A|B|C|D",A|C,"A and C are the correct options.",,PREMIUM,,`,
      `aml-ctf,FILL_BLANK,BEGINNER,"Import test ${id}: the first ML stage is ______.",,,"Placement is first.",,FREE,placement,`,
      `aml-ctf,MATCHING,BEGINNER,"Import test ${id}: match stages",,,"Money laundering stages.",,FREE,,"Deposit cash=>Placement|Shell transfers=>Layering"`,
      `unknown-topic,SINGLE,BEGINNER,"Import test ${id}: bad topic?","A|B",A,"x explanation",,FREE,,`,
      `sanctions,SINGLE,BEGINNER,"Import test ${id}: no correct answer?","A|B",,"Missing correct.",,FREE,,`,
      `sanctions,SINGLE,BEGINNER,"Import test ${id}: which is correct?","One|Two|Three",B,"Duplicate row.",,FREE,,`,
    ].join("\n");
    const r = await importQuestionsCsv(editor, csv);
    expect(r.created).toBe(4);
    expect(r.duplicates).toBe(1);
    expect(r.errors.map((e) => e.row)).toEqual([6, 7]);
    const imported = await db.question.findMany({ where: { stem: { startsWith: `Import test ${id}` } }, include: { options: true } });
    expect(imported.every((x) => x.status === "DRAFT")).toBe(true);
    const multi = imported.find((x) => x.type === "MULTIPLE")!;
    expect(multi.options.filter((o) => o.isCorrect).map((o) => o.text).sort()).toEqual(["A", "C"]);
    expect(imported.find((x) => x.type === "MATCHING")!.options.map((o) => o.matchText)).toEqual(["Placement", "Layering"]);
  });
});

describe("course, flashcard, video, case and knowledge management", () => {
  it("creates a course with modules and lessons and publishes it", async () => {
    const editor = await makeUser({ role: "EDITOR" });
    const t = await topicId("fraud");
    const course = await saveCourse(editor, null, {
      title: `Test Course ${uniq()}`, subtitle: "A test subtitle", overview: "An overview long enough.", topicId: t, level: "BEGINNER", format: "SELF_PACED",
      accessTier: "FREE", durationMinutes: 30, hasCertificate: true, passingScore: 80, maxAttempts: 2, cpdHours: "", objectives: ["Objective one"], keywords: ["test"],
    });
    expect(course.status).toBe("DRAFT");
    await expect(setCourseStatus(editor, course.id, "PUBLISHED")).rejects.toThrow(/at least one lesson/);
    const mod = await saveModule(editor, course.id, null, { title: "Module 1", order: 0 });
    const lesson = await saveLesson(editor, mod.id, null, { title: "Lesson 1", type: "READING", content: "## Heading\nLesson body content.", durationMinutes: 5, order: 0 });
    expect(lesson.slug).toBe("lesson-1");
    const published = await setCourseStatus(editor, course.id, "PUBLISHED");
    expect(published.status).toBe("PUBLISHED");
    expect(await db.assessment.findUnique({ where: { slug: `final-${course.slug}` } })).toMatchObject({ passingScore: 80, type: "FINAL" });
  });

  it("creates flashcard decks and cards", async () => {
    const editor = await makeUser({ role: "EDITOR" });
    const deck = await saveDeck(editor, null, { title: `Deck ${uniq()}`, description: "Test deck", topicId: await topicId(), accessTier: "FREE", status: "PUBLISHED" });
    await saveCard(editor, deck.id, null, { front: "Front", back: "Back", difficulty: "BEGINNER", status: "PUBLISHED" });
    expect(await db.flashcard.count({ where: { deckId: deck.id } })).toBe(1);
  });

  it("validates YouTube videos via oEmbed and requires verification before publishing", async () => {
    const editor = await makeUser({ role: "EDITOR" });
    const base = { description: "An educational video description.", topicId: await topicId(), difficulty: "BEGINNER", accessTier: "FREE", objectives: [], status: "PUBLISHED", channelUrl: "" };
    const okFetch = (async () => new Response(JSON.stringify({ title: "Verified Title", author_name: "Verified Channel", author_url: "https://www.youtube.com/@verified" }), { status: 200 })) as typeof fetch;
    const offline = (async () => { throw new Error("network blocked"); }) as typeof fetch;
    const notFound = (async () => new Response("", { status: 404 })) as typeof fetch;
    await expect(saveVideo(editor, null, { ...base, url: "not a url" }, okFetch)).rejects.toThrow(/valid YouTube/);
    await expect(saveVideo(editor, null, { ...base, url: "https://youtu.be/AAAAAAAAAAA" }, notFound)).rejects.toThrow(/not found/);
    await expect(saveVideo(editor, null, { ...base, url: "https://youtu.be/BBBBBBBBBBB", title: "T", channelName: "C" }, offline)).rejects.toThrow(/manual verification/);
    const { video } = await saveVideo(editor, null, { ...base, url: "https://www.youtube.com/watch?v=CCCCCCCCCCC" }, okFetch);
    expect(video).toMatchObject({ youtubeId: "CCCCCCCCCCC", title: "Verified Title", channelName: "Verified Channel" });
    expect(video.verifiedAt).not.toBeNull();
    await expect(saveVideo(editor, null, { ...base, url: "CCCCCCCCCCC" }, okFetch)).rejects.toThrow(/already/);
    const draft = await saveVideo(editor, null, { ...base, status: "DRAFT", url: "DDDDDDDDDDD", title: "T", channelName: "C" }, offline);
    expect(draft.video.verifiedAt).toBeNull();
    // clean up so the public library stays as seeded
    await db.videoResource.deleteMany({ where: { youtubeId: { in: ["CCCCCCCCCCC", "DDDDDDDDDDD"] } } });
  });

  it("validates case study simulation JSON and requires sources for regulatory explainers", async () => {
    const editor = await makeUser({ role: "EDITOR" });
    const base = {
      title: `Case ${uniq()}`, summary: "A test case summary.", category: "AML_INVESTIGATION", topicId: await topicId("aml-ctf"), difficulty: "BEGINNER", accessTier: "FREE", isFictional: true, featured: false, status: "DRAFT",
      background: "Background text", profile: "Profile", transactionDetails: "Details", businessContext: "Context", redFlags: "A\nB", riskIndicators: "C", investigationQuestions: "Q", evidenceRequired: "E",
      investigationSteps: "S", possibleFindings: "Findings", alternativeExplanations: "Alt", riskConsiderations: "Risk", conclusion: "Conclusion", references: "FATF | https://www.fatf-gafi.org/", followUps: "Q? | A",
    };
    await expect(saveCaseStudy(editor, null, { ...base, simulationJson: "{bad" })).rejects.toThrow(/Simulation JSON/);
    const sim = { documents: [], modelReasoning: "Reasoning text", steps: [{ id: "s1", kind: "indicators", prompt: "Pick", multi: true, options: [{ id: "a", text: "A", correct: true, feedback: "" }, { id: "b", text: "B", correct: false, feedback: "" }] }] };
    const c = await saveCaseStudy(editor, null, { ...base, simulationJson: JSON.stringify(sim) });
    expect(c.redFlags).toEqual(["A", "B"]);
    await expect(saveKnowledge(editor, "article", null, { title: "Explainer", excerpt: "An excerpt text", content: "Content that is long enough to pass.", category: "REGULATORY_EXPLAINER", sources: "", readingMinutes: "3", status: "DRAFT" })).rejects.toThrow(/source/);
  });
});

describe("analytics", () => {
  it("reports real counts from the database", async () => {
    const a = await platformAnalytics();
    expect(a.users).toBe(await db.user.count({ where: { status: "ACTIVE" } }));
    expect(a.enrollments).toBe(await db.enrollment.count());
    expect(a.revenueCents).toBe((await db.payment.aggregate({ where: { status: "SUCCEEDED", provider: { not: "development" } }, _sum: { amountCents: true } }))._sum.amountCents ?? 0);
  });
});
