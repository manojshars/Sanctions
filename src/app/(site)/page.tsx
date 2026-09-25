import Link from "next/link";
import { ArrowRight, BookOpen, Building2, CalendarCheck, CheckCircle2, ClipboardCheck, Layers, Newspaper, PlayCircle, Scale, Search, Sparkles, Timer, TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { ButtonLink } from "@/components/ui/button";
import { Badge, LevelBadge, TierBadge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section";
import { HeroArt } from "@/components/home/hero-art";
import { CourseCard } from "@/components/courses/course-card";
import { FlipCard } from "@/components/flashcards/flip-card";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { EmptyState } from "@/components/ui/feedback";
import { TopicIcon } from "@/lib/topic-icons";
import { flashcardOfTheDay } from "@/server/services/flashcards";
import { formatMoney, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const [topics, featured, sampleQuestions, assessments, decks, videos, caseStudy, articles, glossary, packages, fotd] = await Promise.all([
    db.topic.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { courses: { where: { status: "PUBLISHED" } }, questions: { where: { status: "PUBLISHED" } }, decks: { where: { status: "PUBLISHED", ownerId: null } }, caseStudies: { where: { status: "PUBLISHED" } } } } },
    }),
    db.course.findMany({
      where: { status: "PUBLISHED", slug: { in: ["aml-cft-fundamentals", "global-sanctions-fundamentals", "ofac-50-percent-rule-ownership", "fraud-fundamentals-typologies", "abc-fundamentals", "transaction-monitoring-investigations"] } },
      include: { topic: true, _count: { select: { modules: true } } },
    }),
    db.question.findMany({ where: { status: "PUBLISHED", accessTier: "FREE", type: { in: ["SINGLE", "SCENARIO"] } }, include: { options: { orderBy: { order: "asc" }, select: { id: true, text: true } }, topic: true }, take: 2, orderBy: { createdAt: "asc" } }),
    db.assessment.findMany({ where: { status: "PUBLISHED", type: { in: ["MOCK_EXAM", "READINESS"] } }, orderBy: { order: "asc" }, take: 4 }),
    db.flashcardDeck.findMany({ where: { status: "PUBLISHED", ownerId: null }, include: { topic: true, _count: { select: { cards: true } } }, take: 6, orderBy: { title: "asc" } }),
    db.videoResource.findMany({ where: { status: "PUBLISHED", unavailable: false }, include: { topic: true }, take: 3, orderBy: { createdAt: "desc" } }),
    db.caseStudy.findFirst({ where: { status: "PUBLISHED", featured: true }, include: { topic: true }, orderBy: { updatedAt: "desc" } }),
    db.article.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 3, include: { topic: true } }),
    db.glossaryTerm.findMany({ where: { status: "PUBLISHED" }, take: 4, orderBy: { term: "asc" } }),
    db.learningPackage.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 5 }),
    flashcardOfTheDay(),
  ]);
  const order = ["aml-cft-fundamentals", "global-sanctions-fundamentals", "ofac-50-percent-rule-ownership", "fraud-fundamentals-typologies", "abc-fundamentals", "transaction-monitoring-investigations"];
  featured.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
  return { topics, featured, sampleQuestions, assessments, decks, videos, caseStudy, articles, glossary, packages, fotd };
}

export default async function HomePage() {
  const d = await getHomeData();
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="grid-bg absolute inset-0" aria-hidden />
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-brand/40 blur-3xl" aria-hidden />
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gold-400/10 blur-3xl" aria-hidden />
        <div className="container relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="animate-fade-up">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-xs font-semibold text-gold-200">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Master Financial Crime. Strengthen Compliance. Advance Your Career.
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Your Complete Financial Crime <span className="bg-gradient-to-r from-gold-200 to-gold-400 bg-clip-text text-transparent">Learning &amp; Intelligence</span> Hub
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
              Build practical expertise in AML, sanctions, fraud, anti-bribery and corruption through professional courses, interactive assessments, real-world case studies, and personalized learning.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/academy" variant="gold" size="lg">Explore the Academy <ArrowRight className="h-4 w-4" aria-hidden /></ButtonLink>
              <ButtonLink href="/register" size="lg" className="border border-white/20 bg-white/5 text-white hover:bg-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">Start Learning Free</ButtonLink>
            </div>
            <ul className="mt-8 grid max-w-lg grid-cols-2 gap-3 text-sm text-white/70">
              {["Structured courses with certificates", "Question bank with explanations", "Timed mock examinations", "Spaced-repetition flashcards"].map((f) => (
                <li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-gold-300" aria-hidden />{f}</li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto aspect-[46/38] w-full max-w-[520px]"><HeroArt /></div>
        </div>
      </section>

      {/* Topics */}
      <section className="container py-20" aria-labelledby="topics-heading">
        <SectionHeading eyebrow="Learning areas" title="Explore financial crime topics" description="Eleven specialist areas, each with courses, practice questions, flashcards and practical resources." />
        <h2 id="topics-heading" className="sr-only">Topics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {d.topics.map((t) => (
            <article key={t.id} className="card card-hover group relative flex flex-col p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-gold-300 dark:bg-gold-400/15"><TopicIcon slug={t.slug} className="h-5 w-5" /></span>
              <h3 className="mt-4 font-semibold text-ink">{t.name}</h3>
              <p className="mt-1.5 line-clamp-3 text-sm text-muted">{t.description}</p>
              <p className="mt-4 text-xs text-muted">
                {t._count.courses} courses · {t._count.questions} questions · {t._count.decks} decks{t._count.caseStudies ? ` · ${t._count.caseStudies} cases` : ""}
              </p>
              <Link href={`/academy/courses?topic=${t.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand after:absolute after:inset-0">
                Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section className="border-y border-line bg-surface py-20">
        <div className="container">
          <SectionHeading eyebrow="Academy" title="Featured courses" description="Start with foundations or go deep on specialist topics." href="/academy/courses" linkLabel="Browse the catalog" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {d.featured.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        </div>
      </section>

      {/* Question bank + mock exams */}
      <section className="container grid gap-8 py-20 lg:grid-cols-2">
        <div className="card p-6 sm:p-8">
          <p className="eyebrow">Question Bank</p>
          <h2 className="mt-2 text-2xl font-bold">Practise with explained questions</h2>
          <p className="mt-2 text-muted">Eight question formats, topic and difficulty filters, bookmarks and detailed explanations for every answer.</p>
          <div className="mt-6 space-y-4">
            {d.sampleQuestions.map((q) => (
              <div key={q.id} className="rounded-xl border border-line bg-surface-2 p-4">
                <div className="mb-2 flex items-center gap-2"><Badge tone="brand">{q.topic.shortName}</Badge><LevelBadge level={q.difficulty} /></div>
                {q.scenario && <p className="mb-2 text-sm italic text-muted line-clamp-2">{q.scenario}</p>}
                <p className="text-sm font-medium text-ink">{q.stem}</p>
                <ul className="mt-3 grid gap-1.5 text-sm text-muted sm:grid-cols-2">
                  {q.options.map((o, i) => <li key={o.id} className="rounded-lg border border-line bg-surface px-3 py-1.5"><span className="mr-1.5 font-semibold text-ink">{String.fromCharCode(65 + i)}.</span>{o.text}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/question-bank">Start Practice</ButtonLink>
            <ButtonLink href="/question-bank?mode=DAILY_CHALLENGE" variant="secondary"><CalendarCheck className="h-4 w-4" aria-hidden />Daily Challenge</ButtonLink>
          </div>
        </div>
        <div className="card relative overflow-hidden bg-navy p-6 text-white sm:p-8 dark:bg-surface">
          <div className="grid-bg absolute inset-0 opacity-50" aria-hidden />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-300">Mock Examination Center</p>
            <h2 className="mt-2 text-2xl font-bold">Timed exams with performance analytics</h2>
            <p className="mt-2 text-white/70">Configurable practice formats with a timer, question navigator, mark-for-review, automatic submission and topic-level analysis.</p>
            <ul className="mt-6 space-y-3">
              {d.assessments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-xs text-white/60">{a.questionCount} questions{a.timeLimitMinutes ? ` · ${a.timeLimitMinutes} min` : ""}</p>
                  </div>
                  {a.accessTier === "FREE" ? <Badge tone="success">Free</Badge> : <Badge tone="gold">Premium</Badge>}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/mock-exams" variant="gold"><Timer className="h-4 w-4" aria-hidden />Mock exams</ButtonLink>
              <ButtonLink href="/mock-exams/readiness" className="border border-white/20 bg-transparent text-white hover:bg-white/10 dark:bg-transparent dark:text-white"><TrendingUp className="h-4 w-4" aria-hidden />Readiness assessment</ButtonLink>
            </div>
            <p className="mt-4 text-xs text-white/50">Practice formats are not official external examination formats. Readiness scores are educational indicators only.</p>
          </div>
        </div>
      </section>

      {/* Flashcards */}
      <section className="border-y border-line bg-surface py-20">
        <div className="container grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow">Flashcard of the Day</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">One concept, every day</h2>
            <p className="mt-2 text-muted">Flip the card to reveal the answer, then add it to your deck for spaced-repetition review.</p>
            <div className="mt-6">
              {d.fotd ? (
                <>
                  <FlipCard front={d.fotd.front} back={d.fotd.back} explanation={d.fotd.explanation} topic={d.fotd.deck.topic?.name} />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ButtonLink href="/flashcards/daily" variant="secondary">Open Flashcard of the Day</ButtonLink>
                    <ButtonLink href={`/flashcards/${d.fotd.deck.slug}`} variant="ghost">Study the {d.fotd.deck.title} deck</ButtonLink>
                  </div>
                </>
              ) : (
                <EmptyState title="No flashcards published yet" />
              )}
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="Flashcard Library" title="Topic-based decks" href="/flashcards" linkLabel="All decks" className="mb-6" />
            <div className="grid gap-3 sm:grid-cols-2">
              {d.decks.map((deck) => (
                <Link key={deck.id} href={`/flashcards/${deck.slug}`} className="card card-hover flex items-center gap-4 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-400/15 text-accent"><Layers className="h-5 w-5" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{deck.title}</span>
                    <span className="text-xs text-muted">{deck._count.cards} cards · {deck.topic?.shortName}</span>
                  </span>
                  <TierBadge tier={deck.accessTier} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Video + case study */}
      <section className="container grid gap-8 py-20 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Video Learning" title="Curated video library" href="/videos" linkLabel="Video library" className="mb-6" />
          {d.videos.length ? (
            <div className="space-y-3">
              {d.videos.map((v) => (
                <Link key={v.id} href={`/videos/${v.id}`} className="card card-hover flex gap-4 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`} alt="" className="h-20 w-32 shrink-0 rounded-lg object-cover" loading="lazy" />
                  <span className="min-w-0">
                    <span className="line-clamp-2 font-semibold text-ink">{v.title}</span>
                    <span className="mt-1 block text-xs text-muted">Source: {v.channelName} · {v.topic.shortName}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={PlayCircle} title="Video library in curation" description="Our editors add educational videos only after verifying the source channel and video ID. Check back soon." action={<ButtonLink href="/videos" variant="secondary">Visit Video Learning</ButtonLink>} />
          )}
        </div>
        <div>
          <SectionHeading eyebrow="Case Study of the Week" title="Practise an investigation" href="/case-studies" linkLabel="All case studies" className="mb-6" />
          {d.caseStudy ? (
            <article className="card relative overflow-hidden p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gold">Fictional training case</Badge>
                <Badge tone="brand">{titleCase(d.caseStudy.category)}</Badge>
                <LevelBadge level={d.caseStudy.difficulty} />
              </div>
              <h3 className="mt-4 text-xl font-bold">{d.caseStudy.title}</h3>
              <p className="mt-2 text-muted">{d.caseStudy.summary}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-ink/85">
                {d.caseStudy.redFlags.slice(0, 3).map((r) => <li key={r} className="flex gap-2"><Scale className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />{r}</li>)}
              </ul>
              <ButtonLink href={`/case-studies/${d.caseStudy.slug}`} className="mt-6"><ClipboardCheck className="h-4 w-4" aria-hidden />Start the simulation</ButtonLink>
            </article>
          ) : (
            <EmptyState title="No featured case study" />
          )}
        </div>
      </section>

      {/* Knowledge hub */}
      <section className="border-y border-line bg-surface py-20">
        <div className="container">
          <SectionHeading eyebrow="Knowledge Hub" title="Articles, glossary and regulatory explainers" href="/knowledge" linkLabel="Visit the Knowledge Hub" />
          <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
            <div className="grid gap-5 sm:grid-cols-3">
              {d.articles.map((a) => (
                <Link key={a.id} href={`/knowledge/articles/${a.slug}`} className="card card-hover flex flex-col p-5">
                  <Newspaper className="h-5 w-5 text-accent" aria-hidden />
                  <p className="mt-3 text-xs font-medium text-muted">{titleCase(a.category)} · {a.readingMinutes} min</p>
                  <h3 className="mt-1 font-semibold leading-snug text-ink">{a.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{a.excerpt}</p>
                </Link>
              ))}
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">From the glossary</h3>
                <Link href="/knowledge/glossary" className="text-sm font-semibold text-brand hover:underline">Glossary</Link>
              </div>
              <dl className="mt-4 space-y-4">
                {d.glossary.map((g) => (
                  <div key={g.id}>
                    <dt className="text-sm font-semibold text-ink">{g.term}</dt>
                    <dd className="mt-0.5 line-clamp-2 text-sm text-muted">{g.definition}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <ButtonLink href="/knowledge/regulations" size="sm" variant="secondary"><BookOpen className="h-4 w-4" aria-hidden />Regulatory library</ButtonLink>
                <ButtonLink href="/knowledge/typologies" size="sm" variant="secondary"><Search className="h-4 w-4" aria-hidden />Red flags</ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages + corporate */}
      <section className="container py-20">
        <SectionHeading eyebrow="Learning Packages" title="Memberships and bundles" description="Start free. Upgrade to Premium or choose a focused bundle." href="/pricing" linkLabel="Compare plans" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {d.packages.map((p) => (
            <Link key={p.id} href={`/pricing/packages#${p.slug}`} className="card card-hover flex flex-col p-5">
              <h3 className="font-semibold text-ink">{p.name}</h3>
              <p className="mt-2 flex-1 text-sm text-muted">{p.description}</p>
              <p className="mt-4 font-display text-xl font-bold text-ink">{formatMoney(p.priceCents, p.currency)}<span className="text-xs font-normal text-muted"> / {p.durationDays} days</span></p>
            </Link>
          ))}
        </div>
        <div className="mt-10 grid gap-6 overflow-hidden rounded-2xl border border-line bg-navy p-8 text-white md:grid-cols-[1.4fr_1fr] md:items-center dark:bg-surface">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-300">Corporate Training</p>
            <h2 className="mt-2 text-2xl font-bold">Train your compliance team at scale</h2>
            <p className="mt-2 text-white/70">Assign courses with deadlines, monitor completion and assessment results, generate reports and request customised workshops — with strict organisation-level data isolation.</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <ButtonLink href="/corporate" variant="gold"><Building2 className="h-4 w-4" aria-hidden />Corporate training</ButtonLink>
            <ButtonLink href="/corporate#inquiry" className="border border-white/20 bg-transparent text-white hover:bg-white/10 dark:bg-transparent dark:text-white">Talk to us</ButtonLink>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container pb-8">
        <div className="card grid gap-6 p-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow">Newsletter</p>
            <h2 className="mt-2 text-2xl font-bold">Regulatory explainers and learning updates</h2>
            <p className="mt-2 text-muted">Occasional emails with new courses, practice content and plain-English regulatory explainers. Consent-based; unsubscribe any time.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
