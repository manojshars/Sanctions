import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { makeUser, grantPremium, premiumCourseSlug } from "../helpers";
import { AccessError, NotFoundError, enroll } from "@/server/services/courses";
import { addToCollection, createCustomCard, createPersonalDeck, flashcardStats, getDeckForStudy, getDueCards, rateCard } from "@/server/services/flashcards";
import { CheckoutError, confirmDevPayment, fulfillPayment, startCheckout } from "@/server/services/payments";
import { getEntitlements } from "@/lib/entitlements";
import { closeOwnTicket, createTicket, getTicket, replyToTicket, updateTicket } from "@/server/services/support";
import { acceptInvitation, assignCourse, createOrganization, inviteMember, orgReport, removeMember } from "@/server/services/corporate";
import { deleteAccount, exportUserData } from "@/server/services/account";
import { authenticate } from "@/server/services/auth";
import { submitCaseSimulation } from "@/server/services/cases";

describe("flashcards and spaced repetition", () => {
  it("rating a card persists schedule and history; due list and stats reflect it", async () => {
    const u = await makeUser();
    const { cards } = await getDeckForStudy(u, "aml-terminology");
    const now = new Date();
    const r1 = await rateCard(u, cards[0].id, "GOOD", { now });
    expect(r1).toMatchObject({ repetitions: 1, intervalDays: 1, state: "REVIEW" });
    const r2 = await rateCard(u, cards[1].id, "AGAIN", { now });
    expect(r2.state).toBe("LEARNING");
    expect(await db.flashcardReviewLog.count({ where: { userId: u.id } })).toBe(2);
    const due = await getDueCards(u);
    expect(due.map((d) => d.id)).toContain(cards[1].id);
    expect(due.map((d) => d.id)).not.toContain(cards[0].id);
    const stats = await flashcardStats(u.id);
    expect(stats.dueToday).toBe(1);
    expect(stats.upcoming).toBe(1);
    expect(stats.needsRevision).toBe(1);
    const again = await rateCard(u, cards[0].id, "EASY", { now, known: true });
    expect(again.known).toBe(true);
    expect(again.intervalDays).toBeGreaterThan(1);
  });

  it("blocks premium decks for free users and keeps personal decks private", async () => {
    const free = await makeUser();
    await expect(getDeckForStudy(free, "ownership-and-control")).rejects.toBeInstanceOf(AccessError);
    const premiumCard = await db.flashcard.findFirstOrThrow({ where: { deck: { slug: "ownership-and-control" } } });
    await expect(rateCard(free, premiumCard.id, "GOOD")).rejects.toBeInstanceOf(AccessError);
    const owner = await makeUser();
    const deck = await createPersonalDeck(owner.id, { title: "My sanctions deck", description: "" });
    await createCustomCard(owner.id, { deckId: deck.id, front: "What is OFSI?", back: "UK financial sanctions implementer" });
    const freeCard = await db.flashcard.findFirstOrThrow({ where: { deck: { slug: "aml-terminology" } } });
    await addToCollection(owner, freeCard.id, deck.id);
    const study = await getDeckForStudy(owner, deck.slug);
    expect(study.cards).toHaveLength(2);
    await expect(getDeckForStudy(free, deck.slug)).rejects.toBeInstanceOf(AccessError);
    await expect(createCustomCard(free.id, { deckId: deck.id, front: "Hijack", back: "x" })).rejects.toBeInstanceOf(AccessError);
  });
});

describe("memberships and payments", () => {
  it("development checkout grants access exactly once and is idempotent", async () => {
    const u = await makeUser();
    const { url } = await startCheckout(u, "plan", "premium-monthly");
    expect(url).toMatch(/^\/checkout\/dev\//);
    const paymentId = url.split("/").pop()!;
    expect((await getEntitlements(u)).allAccess).toBe(false);
    await confirmDevPayment(u.id, paymentId);
    await fulfillPayment(paymentId, "dup"); // replayed webhook / double click
    expect(await db.membership.count({ where: { userId: u.id, status: "ACTIVE" } })).toBe(1);
    expect((await getEntitlements(u)).allAccess).toBe(true);
    const course = await db.course.findUniqueOrThrow({ where: { slug: premiumCourseSlug } });
    await expect(enroll(u, course.id)).resolves.toBeTruthy();
    const other = await makeUser();
    await expect(confirmDevPayment(other.id, paymentId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("applies coupons and approved fee assistance", async () => {
    const u = await makeUser();
    await db.coupon.create({ data: { code: `TEST${Date.now()}`, percentOff: 50, maxRedemptions: 1 } });
    const code = (await db.coupon.findFirstOrThrow({ orderBy: { createdAt: "desc" } })).code;
    await db.feeAssistanceRequest.create({ data: { userId: u.id, reason: "x".repeat(40), status: "APPROVED", discountPct: 50, reviewedAt: new Date() } });
    const { url } = await startCheckout(u, "package", "sanctions-professional", code);
    const p = await db.payment.findUniqueOrThrow({ where: { id: url.split("/").pop()! } });
    expect(p.amountCents).toBe(Math.round(14900 * 0.5 * 0.5));
    await confirmDevPayment(u.id, p.id);
    expect((await db.coupon.findUniqueOrThrow({ where: { code } })).redeemedCount).toBe(1);
    const ent = await getEntitlements(u);
    expect(ent.topicSlugs.has("sanctions")).toBe(true);
    expect(ent.allAccess).toBe(false);
    const u2 = await makeUser();
    await expect(startCheckout(u2, "package", "aml-mastery", code)).rejects.toBeInstanceOf(CheckoutError);
  });

  it("corporate and free plans cannot be bought online", async () => {
    const u = await makeUser();
    await expect(startCheckout(u, "plan", "corporate")).rejects.toBeInstanceOf(CheckoutError);
    await expect(startCheckout(u, "plan", "free")).rejects.toBeInstanceOf(CheckoutError);
  });
});

describe("support tickets", () => {
  it("creates tickets, hides internal notes from requesters and tracks status", async () => {
    const learner = await makeUser();
    const agent = await makeUser({ role: "SUPPORT" });
    const t = await createTicket(learner, { category: "Question Bank", subject: "Question explanation unclear", body: "The explanation for Q12 seems incomplete." });
    expect(t.status).toBe("OPEN");
    await replyToTicket(agent, t.number, "Checking with editors", { internal: true });
    await replyToTicket(agent, t.number, "Thanks — we have updated the explanation.");
    const asLearner = await getTicket(learner, t.number);
    expect(asLearner.messages.map((m) => m.body)).not.toContain("Checking with editors");
    expect(asLearner.status).toBe("AWAITING_USER");
    expect(asLearner.firstResponseAt).not.toBeNull();
    const asAgent = await getTicket(agent, t.number);
    expect(asAgent.messages.some((m) => m.isInternal)).toBe(true);
    await replyToTicket(learner, t.number, "Great, thank you");
    expect((await getTicket(learner, t.number)).status).toBe("OPEN");
    // learners cannot post internal notes or change status
    await replyToTicket(learner, t.number, "sneaky", { internal: true });
    expect((await db.supportMessage.findFirstOrThrow({ where: { body: "sneaky" } })).isInternal).toBe(false);
    await expect(updateTicket(learner, t.number, { status: "CLOSED" })).rejects.toBeInstanceOf(AccessError);
    await updateTicket(agent, t.number, { status: "RESOLVED", priority: "HIGH", assigneeId: agent.id });
    const resolved = await db.supportTicket.findUniqueOrThrow({ where: { number: t.number } });
    expect(resolved).toMatchObject({ status: "RESOLVED", priority: "HIGH", assigneeId: agent.id });
    expect(resolved.resolvedAt).not.toBeNull();
    await closeOwnTicket(learner, t.number);
    await expect(replyToTicket(learner, t.number, "again")).rejects.toThrow(/closed/);
    expect(await db.notification.count({ where: { userId: learner.id, title: { contains: `#${t.number}` } } })).toBeGreaterThan(1);
  });

  it("other learners cannot see a ticket", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const t = await createTicket(a, { category: "Other", subject: "Private matter", body: "Please help with my account." });
    await expect(getTicket(b, t.number)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("validates attachments", async () => {
    const u = await makeUser();
    await expect(createTicket(u, { category: "Other", subject: "With a bad file", body: "See attached file please." }, [{ name: "x.png", type: "image/png", bytes: new Uint8Array([1, 2, 3]) }])).rejects.toThrow(/does not match/);
    const ok = await createTicket(u, { category: "Other", subject: "With a good file", body: "See attached file please." }, [{ name: "notes.txt", type: "text/plain", bytes: new TextEncoder().encode("hello") }]);
    expect(await db.supportAttachment.count({ where: { message: { ticketId: ok.id } } })).toBe(1);
    const big = { name: "a.txt", type: "text/plain", bytes: new Uint8Array(1.5 * 1024 * 1024).fill(65) };
    await expect(createTicket(u, { category: "Other", subject: "Too much attached", body: "See attached files please." }, [big, big, big])).rejects.toThrow(/4 MB or smaller in total/);
  });
});

describe("corporate tenant isolation", () => {
  it("managers can only manage their own organisation", async () => {
    const mgrA = await makeUser();
    const mgrB = await makeUser();
    const orgA = await createOrganization(mgrA.id, { name: "Org A" });
    const orgB = await createOrganization(mgrB.id, { name: "Org B" });
    const learnerEmail = `learner-${Date.now()}@example.test`;
    const { token } = await inviteMember(mgrA.id, orgA.id, learnerEmail);
    const learner = await makeUser({ email: learnerEmail });
    await acceptInvitation(learner.id, token);
    const course = await db.course.findUniqueOrThrow({ where: { slug: premiumCourseSlug } });

    // Manager B cannot read or act on Org A
    await expect(orgReport(mgrB.id, orgA.id)).rejects.toBeInstanceOf(AccessError);
    await expect(assignCourse(mgrB.id, orgA.id, { courseId: course.id, userIds: [learner.id] })).rejects.toBeInstanceOf(AccessError);
    await expect(inviteMember(mgrB.id, orgA.id, "x@example.test")).rejects.toBeInstanceOf(AccessError);
    await expect(removeMember(mgrB.id, orgA.id, learner.id)).rejects.toBeInstanceOf(AccessError);
    // Manager B cannot assign Org A's learner through Org B
    await expect(assignCourse(mgrB.id, orgB.id, { courseId: course.id, userIds: [learner.id] })).rejects.toBeInstanceOf(AccessError);
    // A plain member cannot manage
    await expect(orgReport(learner.id, orgA.id)).rejects.toBeInstanceOf(AccessError);

    // Manager A assigns: learner gains access to the premium course and is enrolled
    await assignCourse(mgrA.id, orgA.id, { courseId: course.id, userIds: [learner.id], dueDate: new Date(Date.now() + 7 * 86400_000) });
    expect((await getEntitlements(learner)).courseIds.has(course.id)).toBe(true);
    expect(await db.enrollment.findUnique({ where: { userId_courseId: { userId: learner.id, courseId: course.id } } })).toMatchObject({ source: "CORPORATE" });
    const reportA = await orgReport(mgrA.id, orgA.id);
    expect(reportA.rows).toHaveLength(1);
    expect(reportA.members.map((m) => m.userId).sort()).toEqual([mgrA.id, learner.id].sort());
    const reportB = await orgReport(mgrB.id, orgB.id);
    expect(reportB.rows).toHaveLength(0);
    expect(reportB.members.map((m) => m.userId)).toEqual([mgrB.id]);
  });

  it("invitations are bound to the invited email", async () => {
    const mgr = await makeUser();
    const org = await createOrganization(mgr.id, { name: "Org C" });
    const { token } = await inviteMember(mgr.id, org.id, "intended@example.test");
    const stranger = await makeUser();
    await expect(acceptInvitation(stranger.id, token)).rejects.toThrow(/sent to/);
  });
});

describe("case simulations", () => {
  it("records graded attempts and enforces premium access", async () => {
    const u = await makeUser();
    const res = await submitCaseSimulation(u, "harbourline-logistics-ownership", { s4: ["b"], s5: ["b"] }, "Do not proceed.");
    expect(res.total).toBeGreaterThan(0);
    expect(await db.caseAttempt.count({ where: { userId: u.id } })).toBe(1);
    await expect(submitCaseSimulation(u, "student-account-mule-network", {}, "")).rejects.toBeInstanceOf(AccessError);
    await grantPremium(u.id);
    await expect(submitCaseSimulation(u, "student-account-mule-network", {}, "")).resolves.toBeTruthy();
  });
});

describe("privacy: export and deletion", () => {
  it("exports the learner's data and deletes the account", async () => {
    const u = await makeUser({ name: "Leaving Learner" });
    await createTicket(u, { category: "Other", subject: "Before I go", body: "Some personal message here." });
    const data = await exportUserData(u.id);
    expect(data.user.email).toBe(u.email);
    expect(data.user.tickets).toHaveLength(1);
    await expect(deleteAccount(u.id, "wrong")).rejects.toThrow(/incorrect/);
    await deleteAccount(u.id, "Password123!");
    const after = await db.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(after).toMatchObject({ status: "DELETED", name: "Deleted user" });
    expect(after.email).not.toBe(u.email);
    expect(await db.supportTicket.count({ where: { userId: u.id } })).toBe(0);
    expect(await authenticate(u.email, "Password123!")).toBeNull();
  });
});
