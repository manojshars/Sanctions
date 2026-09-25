/**
 * Idempotent seed. All records are clearly-labelled development/sample content authored for
 * FinCrime Academy. Re-running updates content by slug without duplicating it.
 *
 * Demo accounts are created unless SEED_DEMO_USERS=false (never enable demo users in production).
 */
import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TOPICS } from "./seed-data/topics";
import { AML_COURSES } from "./seed-data/courses/aml";
import { SANCTIONS_COURSES } from "./seed-data/courses/sanctions";
import { FRAUD_COURSES } from "./seed-data/courses/fraud";
import { ABC_COURSES } from "./seed-data/courses/abc";
import { OTHER_COURSES } from "./seed-data/courses/other";
import { AML_QUESTIONS, SANCTIONS_QUESTIONS } from "./seed-data/questions/aml-sanctions";
import { FRAUD_QUESTIONS, ABC_QUESTIONS, KYC_TM_INV_QUESTIONS, TRADE_EXPORT_CRYPTO_GOV_QUESTIONS } from "./seed-data/questions/other-topics";
import { BATCH2_QUESTIONS } from "./seed-data/questions/batch2";
import type { Q } from "./seed-data/questions/types";
import { DECKS } from "./seed-data/flashcards";
import { GLOSSARY } from "./seed-data/glossary";
import { REGULATIONS, TYPOLOGIES, ARTICLES } from "./seed-data/knowledge";
import { CASES } from "./seed-data/cases";
import { HELP_ARTICLES, PLANS, PACKAGES, ASSESSMENTS } from "./seed-data/platform";
import { questionContentHash } from "../src/lib/question-hash";
import { slugify } from "../src/lib/utils";

const db = new PrismaClient();
const REVIEWED = new Date("2026-09-25T00:00:00Z");
const LVL = { B: "BEGINNER", I: "INTERMEDIATE", A: "ADVANCED" } as const;

async function seedTopics() {
  for (const [i, t] of TOPICS.entries()) {
    await db.topic.upsert({
      where: { slug: t.slug },
      update: { name: t.name, shortName: t.shortName, description: t.description, icon: t.icon, order: i },
      create: { slug: t.slug, name: t.name, shortName: t.shortName, description: t.description, icon: t.icon, order: i },
    });
  }
  return Object.fromEntries((await db.topic.findMany()).map((t) => [t.slug, t.id]));
}

async function seedCourses(topicIds: Record<string, string>) {
  const all = [...AML_COURSES, ...SANCTIONS_COURSES, ...FRAUD_COURSES, ...ABC_COURSES, ...OTHER_COURSES];
  for (const c of all) {
    const data = {
      title: c.title, subtitle: c.subtitle, overview: c.overview, topicId: topicIds[c.topic], level: c.level,
      format: c.format ?? "SELF_PACED", accessTier: c.tier, durationMinutes: c.minutes, hasCertificate: c.certificate ?? true,
      cpdHours: c.cpd ?? null, keywords: c.keywords ?? [], status: "PUBLISHED" as const, publishedAt: REVIEWED,
    };
    if (!topicIds[c.topic]) throw new Error(`Unknown topic ${c.topic} for ${c.slug}`);
    const course = await db.course.upsert({ where: { slug: c.slug }, update: data, create: { slug: c.slug, ...data } });
    // Rebuild structure (seed content is authoritative for seed courses).
    await db.learningObjective.deleteMany({ where: { courseId: course.id } });
    await db.learningObjective.createMany({ data: c.objectives.map((text, order) => ({ courseId: course.id, text, order })) });
    const existingModules = await db.module.findMany({ where: { courseId: course.id }, include: { lessons: true } });
    for (const [mi, m] of c.modules.entries()) {
      let mod = existingModules.find((x) => x.order === mi);
      mod = mod
        ? await db.module.update({ where: { id: mod.id }, data: { title: m.title, summary: m.summary ?? null }, include: { lessons: true } })
        : await db.module.create({ data: { courseId: course.id, title: m.title, summary: m.summary ?? null, order: mi }, include: { lessons: true } });
      for (const [li, l] of m.lessons.entries()) {
        const slug = slugify(l.title);
        const lessonData = { title: l.title, type: l.type ?? (l.exercise ? "EXERCISE" : "READING"), content: l.content.trim(), exercise: l.exercise ?? null, durationMinutes: l.minutes ?? 10, order: li } as const;
        await db.lesson.upsert({ where: { moduleId_slug: { moduleId: mod.id, slug } }, update: lessonData, create: { moduleId: mod.id, slug, ...lessonData } });
      }
    }
    await db.courseResource.deleteMany({ where: { courseId: course.id } });
    if (c.resources?.length) {
      await db.courseResource.createMany({
        data: c.resources.map((r) => ({ courseId: course.id, title: r.title, filename: r.filename, description: r.description ?? null, content: r.content, accessTier: r.tier ?? "PREMIUM" })),
      });
    }
  }
  // Related courses
  for (const c of all) {
    if (!c.related?.length) continue;
    const related = await db.course.findMany({ where: { slug: { in: c.related } }, select: { id: true } });
    await db.course.update({ where: { slug: c.slug }, data: { related: { set: related.map((r) => ({ id: r.id })) } } });
  }
  return all.length;
}

async function seedQuestions(topicIds: Record<string, string>, authorId: string) {
  const courseMap = Object.fromEntries((await db.course.findMany({ select: { slug: true, id: true, topicId: true } })).map((c) => [c.slug, c]));
  const sets: [Q[], string][] = [
    [AML_QUESTIONS, "aml-ctf"], [SANCTIONS_QUESTIONS, "sanctions"], [FRAUD_QUESTIONS, "fraud"], [ABC_QUESTIONS, "abc"],
    [KYC_TM_INV_QUESTIONS, "kyc-cdd"], [TRADE_EXPORT_CRYPTO_GOV_QUESTIONS, "governance"], [BATCH2_QUESTIONS, "aml-ctf"],
  ];
  let count = 0;
  for (const [set, defaultTopic] of sets) {
    for (const q of set) {
      const course = q.course ? courseMap[q.course] : undefined;
      if (q.course && !course) throw new Error(`Unknown course ${q.course}`);
      const topicId = course?.topicId ?? topicIds[defaultTopic];
      let options: { text: string; isCorrect: boolean; matchText?: string | null; explanation?: string | null; order: number }[] = [];
      if (q.t === "MATCHING") {
        options = (q.m ?? []).map(([left, right], i) => ({ text: left, isCorrect: true, matchText: right, order: i }));
      } else if (q.o) {
        options = q.o.map((text, i) => ({ text, isCorrect: (q.c ?? []).includes(i), explanation: q.oe?.[i] ?? null, order: i }));
      }
      const hash = questionContentHash(q.s, options.map((o) => o.text));
      const data = {
        topicId, type: q.t, difficulty: LVL[q.d], stem: q.s, scenario: q.sc ?? null, explanation: q.e,
        practicalApplication: q.p ?? null, sourceReference: q.src ?? null, sourceUrl: q.url ?? null, tags: q.tags ?? [],
        acceptedAnswers: q.a ?? [], keywords: q.k ?? [], modelAnswer: q.ma ?? null, status: "PUBLISHED" as const,
        accessTier: q.tier === "F" ? ("FREE" as const) : ("PREMIUM" as const), courseId: course?.id ?? null, contentHash: hash,
        authorId, reviewedById: authorId, reviewedAt: REVIEWED,
      };
      const existing = await db.question.findFirst({ where: { contentHash: hash } });
      if (existing) {
        await db.question.update({ where: { id: existing.id }, data });
        await db.answerOption.deleteMany({ where: { questionId: existing.id } });
        await db.answerOption.createMany({ data: options.map((o) => ({ ...o, questionId: existing.id })) });
      } else {
        const created = await db.question.create({ data: { ...data, options: { create: options } } });
        await db.questionVersion.create({ data: { questionId: created.id, version: 1, snapshot: { ...data, options } as unknown as Prisma.InputJsonValue, editedById: authorId, note: "Initial seed" } });
      }
      count++;
    }
  }
  return count;
}

async function seedAssessments() {
  for (const a of ASSESSMENTS) {
    const data = {
      name: a.name, description: a.description, type: a.type, questionCount: a.questionCount, timeLimitMinutes: a.timeLimitMinutes,
      accessTier: a.accessTier, order: a.order, configurable: "configurable" in a ? a.configurable : false,
      difficulty: "difficulty" in a ? a.difficulty : null, passingScore: 70,
    };
    await db.assessment.upsert({ where: { slug: a.slug }, update: data, create: { slug: a.slug, ...data } });
  }
  const courses = await db.course.findMany({ where: { hasCertificate: true } });
  for (const c of courses) {
    const data = { name: `${c.title} — Final Assessment`, description: `Final assessment for ${c.title}.`, type: "FINAL" as const, questionCount: 10, timeLimitMinutes: 20, passingScore: c.passingScore, accessTier: c.accessTier, courseId: c.id };
    await db.assessment.upsert({ where: { slug: `final-${c.slug}` }, update: data, create: { slug: `final-${c.slug}`, ...data } });
  }
}

async function seedFlashcards(topicIds: Record<string, string>) {
  let n = 0;
  for (const d of DECKS) {
    const deck = await db.flashcardDeck.upsert({
      where: { slug: d.slug },
      update: { title: d.title, description: d.description, topicId: topicIds[d.topic], accessTier: d.tier, status: "PUBLISHED" },
      create: { slug: d.slug, title: d.title, description: d.description, topicId: topicIds[d.topic], accessTier: d.tier, status: "PUBLISHED" },
    });
    const existing = await db.flashcard.findMany({ where: { deckId: deck.id } });
    for (const [i, [front, back, explanation]] of d.cards.entries()) {
      const found = existing.find((c) => c.front === front);
      const data = { front, back, explanation: explanation || null, topicId: topicIds[d.topic], order: i, status: "PUBLISHED" as const };
      if (found) await db.flashcard.update({ where: { id: found.id }, data });
      else await db.flashcard.create({ data: { ...data, deckId: deck.id } });
      n++;
    }
  }
  return n;
}

async function seedKnowledge(topicIds: Record<string, string>) {
  for (const g of GLOSSARY) {
    const slug = slugify(g.term);
    const data = { term: g.term, definition: g.definition, topicId: topicIds[g.topic], relatedTerms: g.related ?? [], example: g.example ?? null, sourceReference: g.source ?? null, sourceUrl: g.url ?? null, lastReviewedAt: REVIEWED, status: "PUBLISHED" as const };
    await db.glossaryTerm.upsert({ where: { slug }, update: data, create: { slug, ...data } });
  }
  for (const r of REGULATIONS) {
    const data = {
      authority: r.authority, title: r.title, jurisdiction: r.jurisdiction, summary: r.summary, officialUrl: r.url,
      publishedDate: r.published ? new Date(r.published) : null, effectiveDate: r.effective ? new Date(r.effective) : null,
      dateNote: r.dateNote ?? null, regStatus: r.status ?? "CURRENT", topicId: r.topic ? topicIds[r.topic] : null, lastReviewedAt: REVIEWED, status: "PUBLISHED" as const,
    };
    await db.regulatoryReference.upsert({ where: { slug: r.slug }, update: data, create: { slug: r.slug, ...data } });
  }
  for (const t of TYPOLOGIES) {
    const data = { title: t.title, category: t.category, description: t.description, indicators: t.indicators, example: t.example ?? null, sourceReference: t.source ?? null, sourceUrl: t.url ?? null, lastReviewedAt: REVIEWED, status: "PUBLISHED" as const };
    await db.typology.upsert({ where: { slug: t.slug }, update: data, create: { slug: t.slug, ...data } });
  }
  for (const a of ARTICLES) {
    const data = { title: a.title, excerpt: a.excerpt, content: a.content, category: a.category, topicId: topicIds[a.topic], sources: a.sources, readingMinutes: a.minutes, publishedAt: REVIEWED, lastReviewedAt: REVIEWED, status: "PUBLISHED" as const };
    await db.article.upsert({ where: { slug: a.slug }, update: data, create: { slug: a.slug, ...data } });
  }
  for (const c of CASES) {
    const { slug, topic, tier, featured, simulation, references, followUpQuestions, ...rest } = c;
    const data = { ...rest, topicId: topicIds[topic], accessTier: tier, featured: !!featured, isFictional: true, simulation: simulation as unknown as Prisma.InputJsonValue, references, followUpQuestions, status: "PUBLISHED" as const };
    await db.caseStudy.upsert({ where: { slug }, update: data, create: { slug, ...data } });
  }
  for (const h of HELP_ARTICLES) {
    const data = { title: h.title, category: h.category, content: h.content, relatedSlugs: h.related, status: "PUBLISHED" as const };
    await db.helpArticle.upsert({ where: { slug: h.slug }, update: data, create: { slug: h.slug, ...data } });
  }
}

async function seedCommerce() {
  for (const p of PLANS) {
    const data = { name: p.name, description: p.description, tier: p.tier, priceCents: p.priceCents, interval: p.interval, features: [...p.features], order: p.order };
    await db.membershipPlan.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
  }
  for (const p of PACKAGES) {
    const courses = p.topicSlugs.length
      ? await db.course.findMany({ where: { topic: { slug: { in: [...p.topicSlugs] } } }, select: { id: true } })
      : await db.course.findMany({ select: { id: true } });
    const data = { name: p.name, description: p.description, priceCents: p.priceCents, topicSlugs: [...p.topicSlugs], entitlements: [...p.entitlements], features: [...p.features], order: p.order, courses: { set: courses } };
    await db.learningPackage.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data, courses: { connect: courses } } });
  }
  await db.setting.upsert({ where: { key: "feeAssistance" }, update: {}, create: { key: "feeAssistance", value: { enabled: true, maxDiscountPct: 50 } } });
  await db.setting.upsert({ where: { key: "questionBank" }, update: {}, create: { key: "questionBank", value: { freeDailyQuestionLimit: 30 } } });
}

async function upsertUser(email: string, name: string, role: "LEARNER" | "EDITOR" | "SUPPORT" | "ADMIN", password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  return db.user.upsert({
    where: { email },
    update: { role, name },
    create: { email, name, role, passwordHash, emailVerifiedAt: new Date(), interests: ["sanctions", "aml-ctf"], level: "INTERMEDIATE" },
  });
}

async function seedUsers() {
  const admin = await upsertUser(process.env.SEED_ADMIN_EMAIL || "admin@fincrime.academy", "Platform Administrator", "ADMIN", process.env.SEED_ADMIN_PASSWORD || "ChangeMe!Admin2026");
  if (process.env.SEED_DEMO_USERS === "false") return admin;
  const pw = "DemoPass2026!";
  await upsertUser("editor@demo.fincrime.academy", "Demo Content Editor", "EDITOR", pw);
  await upsertUser("support@demo.fincrime.academy", "Demo Support Agent", "SUPPORT", pw);
  await upsertUser("learner@demo.fincrime.academy", "Demo Learner", "LEARNER", pw);
  const premium = await upsertUser("premium@demo.fincrime.academy", "Demo Premium Learner", "LEARNER", pw);
  const manager = await upsertUser("manager@demo.fincrime.academy", "Demo Corporate Manager", "LEARNER", pw);
  const employee = await upsertUser("employee@demo.fincrime.academy", "Demo Team Member", "LEARNER", pw);

  const premiumPlan = await db.membershipPlan.findUniqueOrThrow({ where: { slug: "premium-annual" } });
  if (!(await db.membership.findFirst({ where: { userId: premium.id, status: "ACTIVE" } }))) {
    await db.membership.create({ data: { userId: premium.id, planId: premiumPlan.id, source: "ADMIN", endsAt: new Date(Date.now() + 365 * 86400_000) } });
  }
  const org = await db.organization.upsert({ where: { slug: "demo-bank" }, update: {}, create: { name: "Demo Bank plc (sample organisation)", slug: "demo-bank", industry: "Banking", seatLimit: 25 } });
  for (const [u, role] of [[manager, "MANAGER"], [employee, "MEMBER"]] as const) {
    await db.organizationMember.upsert({ where: { orgId_userId: { orgId: org.id, userId: u.id } }, update: { role }, create: { orgId: org.id, userId: u.id, role } });
  }
  const corpPlan = await db.membershipPlan.findUniqueOrThrow({ where: { slug: "corporate" } });
  if (!(await db.membership.findFirst({ where: { orgId: org.id, status: "ACTIVE" } }))) {
    await db.membership.create({ data: { orgId: org.id, planId: corpPlan.id, source: "ADMIN", endsAt: new Date(Date.now() + 365 * 86400_000) } });
  }
  return admin;
}

async function main() {
  const topicIds = await seedTopics();
  const courses = await seedCourses(topicIds);
  await seedCommerce();
  const admin = await seedUsers();
  const questions = await seedQuestions(topicIds, admin.id);
  await seedAssessments();
  const cards = await seedFlashcards(topicIds);
  await seedKnowledge(topicIds);
  console.log(`Seeded: ${TOPICS.length} topics, ${courses} courses, ${questions} questions, ${DECKS.length} decks / ${cards} cards, ${GLOSSARY.length} glossary terms, ${REGULATIONS.length} regulatory references, ${TYPOLOGIES.length} typologies, ${ARTICLES.length} articles, ${CASES.length} case studies, ${HELP_ARTICLES.length} help articles.`);
  console.log("Video library: no videos are seeded. Add verified YouTube videos via Admin → Videos.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
