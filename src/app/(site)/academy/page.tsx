import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, BookOpenCheck, Compass, GraduationCap } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { CourseCard } from "@/components/courses/course-card";
import { TopicIcon } from "@/lib/topic-icons";

export const metadata: Metadata = { title: "Academy", description: "Structured financial crime courses across AML, sanctions, fraud, ABC and more." };
export const dynamic = "force-dynamic";

const PATHS = [
  { title: "AML Analyst path", desc: "From fundamentals to monitoring, investigations and reporting.", slugs: ["aml-cft-fundamentals", "customer-due-diligence-kyc", "transaction-monitoring-investigations", "suspicious-activity-reporting"] },
  { title: "Sanctions Specialist path", desc: "Regimes, screening, ownership and evasion typologies.", slugs: ["global-sanctions-fundamentals", "sanctions-screening-alert-investigation", "ofac-50-percent-rule-ownership", "sanctions-evasion-typologies"] },
  { title: "Fraud & ABC path", desc: "Fraud typologies, investigations and anti-bribery controls.", slugs: ["fraud-fundamentals-typologies", "payment-fraud-app-scams", "abc-fundamentals", "third-party-intermediary-due-diligence"] },
];

export default async function AcademyPage() {
  const [topics, beginner, totals] = await Promise.all([
    db.topic.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { courses: { where: { status: "PUBLISHED" } } } } } }),
    db.course.findMany({ where: { status: "PUBLISHED", accessTier: "FREE" }, include: { topic: true, _count: { select: { modules: true } } }, take: 6, orderBy: { title: "asc" } }),
    db.course.count({ where: { status: "PUBLISHED" } }),
  ]);
  const pathCourses = await db.course.findMany({ where: { slug: { in: PATHS.flatMap((p) => p.slugs) } }, select: { slug: true, title: true } });
  const title = (s: string) => pathCourses.find((c) => c.slug === s)?.title ?? s;
  return (
    <>
      <PageHeader eyebrow="Financial Crime Academy" title="Structured learning for financial crime professionals" description={`${totals} courses across eleven specialist areas — with lessons, practical exercises, knowledge checks, final assessments and completion certificates.`}>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/academy/courses" variant="gold">Browse the catalog <ArrowRight className="h-4 w-4" /></ButtonLink>
          <ButtonLink href="/mock-exams/readiness" className="border border-white/20 bg-transparent text-white hover:bg-white/10 dark:bg-transparent dark:text-white">Find my level</ButtonLink>
        </div>
      </PageHeader>
      <section className="container py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {[{ i: Compass, t: "Learn", d: "Self-paced lessons with objectives, readings and exercises." }, { i: BookOpenCheck, t: "Check", d: "Knowledge checks and a final assessment for each course." }, { i: Award, t: "Certify", d: "Internal completion certificates with public verification." }].map(({ i: I, t, d }) => (
            <div key={t} className="card flex gap-4 p-5"><I className="h-6 w-6 shrink-0 text-accent" aria-hidden /><div><p className="font-semibold">{t}</p><p className="text-sm text-muted">{d}</p></div></div>
          ))}
        </div>
      </section>
      <section className="container pb-14">
        <SectionHeading eyebrow="Browse by topic" title="Course topics" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map((t) => (
            <Link key={t.id} href={`/academy/courses?topic=${t.slug}`} className="card card-hover flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand"><TopicIcon slug={t.slug} className="h-5 w-5" /></span>
              <span><span className="block font-semibold text-ink">{t.name}</span><span className="text-xs text-muted">{t._count.courses} courses</span></span>
            </Link>
          ))}
        </div>
      </section>
      <section className="border-y border-line bg-surface py-14">
        <div className="container">
          <SectionHeading eyebrow="Suggested paths" title="Learning paths" description="Suggested sequences — take courses in any order." />
          <div className="grid gap-5 lg:grid-cols-3">
            {PATHS.map((p) => (
              <div key={p.title} className="card p-6">
                <GraduationCap className="h-6 w-6 text-accent" aria-hidden />
                <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
                <p className="text-sm text-muted">{p.desc}</p>
                <ol className="mt-4 space-y-2">
                  {p.slugs.map((s, i) => (
                    <li key={s}><Link href={`/academy/courses/${s}`} className="flex gap-3 rounded-lg p-2 text-sm hover:bg-surface-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-gold-300">{i + 1}</span>{title(s)}</Link></li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container py-14">
        <SectionHeading eyebrow="Start free" title="Free foundational courses" href="/academy/courses?access=FREE" linkLabel="All free courses" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{beginner.map((c) => <CourseCard key={c.id} course={c} />)}</div>
      </section>
    </>
  );
}
