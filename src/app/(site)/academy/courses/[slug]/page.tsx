import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, BookOpen, CheckCircle2, Circle, Clock, Download, FileText, Lock, PenLine, PlayCircle, Target } from "lucide-react";
import { getCourseDetail, courseAccess, getEnrollment } from "@/server/services/courses";
import { getCompletionStatus } from "@/server/services/certificates";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Breadcrumbs } from "@/components/ui/section";
import { Badge, LevelBadge, TierBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Progress } from "@/components/ui/feedback";
import { CourseCard } from "@/components/courses/course-card";
import { EnrollButton, StartFinalButton } from "@/components/courses/course-actions";
import { BookmarkButton } from "@/components/common/bookmark-button";
import { formatBytes, formatDuration, appUrl, titleCase } from "@/lib/utils";
import { TopicIcon } from "@/lib/topic-icons";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const c = await db.course.findFirst({ where: { slug, status: "PUBLISHED" }, select: { title: true, subtitle: true } });
  if (!c) return { title: "Course not found" };
  return { title: c.title, description: c.subtitle, openGraph: { title: c.title, description: c.subtitle, type: "article" } };
}

export default async function CourseDetailPage({ params }: Params) {
  const { slug } = await params;
  const course = await getCourseDetail(slug);
  if (!course) notFound();
  const user = await getCurrentUser();
  const hasAccess = await courseAccess(user, course);
  const enrollment = user ? await getEnrollment(user.id, course.id) : null;
  const status = enrollment && user ? await getCompletionStatus(user.id, course.id) : null;
  const done = new Set(
    user && enrollment ? (await db.lessonProgress.findMany({ where: { userId: user.id, status: "COMPLETED", lesson: { module: { courseId: course.id } } }, select: { lessonId: true } })).map((p) => p.lessonId) : [],
  );
  const certificate = user ? await db.certificate.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }) : null;
  const bookmarked = user ? !!(await db.bookmark.findFirst({ where: { userId: user.id, entityType: "COURSE", entityId: course.id } })) : false;
  const lessons = course.modules.flatMap((m) => m.lessons);
  const resume = enrollment?.lastLessonId ? lessons.find((l) => l.id === enrollment.lastLessonId) : null;
  const firstIncomplete = lessons.find((l) => !done.has(l.id)) ?? lessons[0];
  const continueLesson = resume && !done.has(resume.id) ? resume : firstIncomplete;
  const final = course.assessments[0];
  const pct = status ? Math.round((status.completedLessons / Math.max(status.totalLessons, 1)) * 100) : 0;

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Course", name: course.title, description: course.overview,
    provider: { "@type": "Organization", name: "FinCrime Academy", sameAs: appUrl() },
    educationalLevel: titleCase(course.level), timeRequired: `PT${course.durationMinutes}M`, isAccessibleForFree: course.accessTier === "FREE",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="grid-bg absolute inset-0 opacity-60" aria-hidden />
        <div className="container relative grid gap-10 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <Breadcrumbs items={[{ label: "Academy", href: "/academy" }, { label: "Courses", href: "/academy/courses" }, { label: course.title }]} />
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs"><TopicIcon slug={course.topic.slug} className="h-3.5 w-3.5 text-gold-300" />{course.topic.name}</span>
              <LevelBadge level={course.level} /><TierBadge tier={course.accessTier} />
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{course.title}</h1>
            <p className="mt-3 max-w-2xl text-lg text-white/75">{course.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{formatDuration(course.durationMinutes)}</span>
              <span className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{course.modules.length} modules · {lessons.length} lessons</span>
              <span className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4" />{titleCase(course.format)}</span>
              {course.hasCertificate && <span className="inline-flex items-center gap-1.5"><Award className="h-4 w-4 text-gold-300" />Completion certificate{course.cpdHours ? ` · ${course.cpdHours} CPD hours (indicative)` : ""}</span>}
            </div>
          </div>
          <aside className="card self-start p-6 text-ink">
            {enrollment ? (
              <>
                <p className="text-sm font-semibold">{enrollment.status === "COMPLETED" ? "Course completed" : "Your progress"}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted"><span>{status?.completedLessons}/{status?.totalLessons} lessons</span><span>{pct}%</span></div>
                <Progress value={pct} tone="gold" className="mt-1" />
                {continueLesson && enrollment.status !== "COMPLETED" && (
                  <ButtonLink href={`/academy/courses/${course.slug}/lessons/${continueLesson.slug}`} variant="gold" size="lg" className="mt-5 w-full">
                    <PlayCircle className="h-4 w-4" /> {done.size ? "Continue learning" : "Start first lesson"}
                  </ButtonLink>
                )}
                {certificate && <ButtonLink href={`/certificates/${certificate.id}`} variant="secondary" className="mt-3 w-full"><Award className="h-4 w-4" /> View certificate</ButtonLink>}
              </>
            ) : hasAccess ? (
              <>
                <p className="text-sm text-muted">{course.accessTier === "FREE" ? "Free for registered learners." : "Included in your membership."}</p>
                <div className="mt-4"><EnrollButton courseId={course.id} /></div>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4 text-accent" /> Premium course</p>
                <p className="mt-1 text-sm text-muted">Available with Premium, a relevant learning package, or a corporate assignment.</p>
                <ButtonLink href="/pricing" variant="gold" size="lg" className="mt-4 w-full">View plans</ButtonLink>
                {!user && <ButtonLink href={`/login?next=/academy/courses/${course.slug}`} variant="secondary" className="mt-2 w-full">Log in</ButtonLink>}
              </>
            )}
            {!user && course.accessTier === "FREE" && <p className="mt-3 text-center text-xs text-muted">You&apos;ll be asked to sign in or create a free account.</p>}
            {user && <div className="mt-4 border-t border-line pt-4"><BookmarkButton entityType="COURSE" entityId={course.id} initial={bookmarked} label="Save course" /></div>}
          </aside>
        </div>
      </section>

      <div className="container grid gap-10 py-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold">Overview</h2>
            <p className="mt-3 leading-relaxed text-ink/85">{course.overview}</p>
          </section>
          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Target className="h-5 w-5 text-accent" /> Learning objectives</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {course.objectives.map((o) => <li key={o.id} className="flex gap-2.5 text-sm text-ink/85"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{o.text}</li>)}
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold">Course content</h2>
            <div className="mt-4 space-y-4">
              {course.modules.map((m, mi) => (
                <div key={m.id} className="card overflow-hidden">
                  <div className="border-b border-line bg-surface-2 px-5 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Module {mi + 1}</p>
                    <p className="font-semibold">{m.title}</p>
                    {m.summary && <p className="text-sm text-muted">{m.summary}</p>}
                  </div>
                  <ul className="divide-y divide-line">
                    {m.lessons.map((l) => {
                      const complete = done.has(l.id);
                      const Icon = l.type === "EXERCISE" ? PenLine : l.type === "VIDEO" ? PlayCircle : FileText;
                      const inner = (
                        <span className="flex items-center gap-3 px-5 py-3 text-sm">
                          {complete ? <CheckCircle2 className="h-4 w-4 text-success" aria-label="Completed" /> : <Circle className="h-4 w-4 text-line" aria-hidden />}
                          <Icon className="h-4 w-4 text-muted" aria-hidden />
                          <span className="flex-1">{l.title}</span>
                          <span className="text-xs text-muted">{l.durationMinutes} min</span>
                        </span>
                      );
                      return <li key={l.id}>{enrollment ? <Link href={`/academy/courses/${course.slug}/lessons/${l.slug}`} className="block hover:bg-surface-2">{inner}</Link> : inner}</li>;
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
          {course.reviews.length > 0 && (
            <section>
              <h2 className="text-xl font-bold">Learner reviews</h2>
              <ul className="mt-4 space-y-3">{course.reviews.map((r) => <li key={r.id} className="card p-4 text-sm"><p className="font-semibold">{"★".repeat(r.rating)}<span className="text-muted">{"★".repeat(5 - r.rating)}</span> · {r.user.name}</p>{r.comment && <p className="mt-1 text-ink/85">{r.comment}</p>}</li>)}</ul>
            </section>
          )}
        </div>
        <aside className="space-y-5">
          {final && (
            <div className="card p-5">
              <h2 className="font-semibold">Final assessment</h2>
              <p className="mt-1 text-sm text-muted">{final.questionCount} questions · pass mark {final.passingScore}%{final.timeLimitMinutes ? ` · ${final.timeLimitMinutes} min` : ""} · up to {course.maxAttempts} attempts</p>
              {status && (
                <div className="mt-4 space-y-3 text-sm">
                  {status.finalPassed ? <Alert tone="success">Passed{status.bestFinalScore != null ? ` with ${status.bestFinalScore}%` : ""}.</Alert> : (
                    <>
                      {!status.lessonsComplete && <p className="text-muted">Complete all lessons to unlock the final assessment.</p>}
                      {status.attemptsUsed > 0 && <p className="text-muted">Attempts used: {status.attemptsUsed}/{status.maxAttempts}{status.bestFinalScore != null ? ` · best ${status.bestFinalScore}%` : ""}</p>}
                      <StartFinalButton courseId={course.id} disabled={!status.lessonsComplete || status.attemptsUsed >= status.maxAttempts} label={status.attemptsUsed ? "Retake final assessment" : "Start final assessment"} />
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          {course.hasCertificate && (
            <div className="card p-5 text-sm">
              <h2 className="flex items-center gap-2 font-semibold"><Award className="h-4 w-4 text-accent" /> Certificate eligibility</h2>
              <p className="mt-2 text-muted">Complete all lessons and pass the final assessment ({course.passingScore}%) to receive a verifiable completion certificate.</p>
              <p className="mt-2 text-xs text-muted">This is an internal completion certificate, not an external accredited qualification.</p>
            </div>
          )}
          {course.resources.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold">Downloadable resources</h2>
              <ul className="mt-3 space-y-2">
                {course.resources.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-start gap-2"><Download className="mt-0.5 h-4 w-4 shrink-0 text-muted" /><span>{r.title}{r.mimeType === "application/pdf" && <span className="block text-xs text-muted">PDF{r.sizeBytes ? ` · ${formatBytes(r.sizeBytes)}` : ""}{r.pageCount ? ` · ${r.pageCount} pages` : ""}</span>}</span></span>
                    {enrollment ? <a href={`/academy/courses/${course.slug}/resources/${r.id}`} className="font-semibold text-brand hover:underline">Download</a> : <Badge tone="outline">Enrol to download</Badge>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {course.related.length > 0 && (
        <section className="border-t border-line bg-surface py-12">
          <div className="container">
            <h2 className="mb-6 text-xl font-bold">Related courses</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{course.related.map((c) => <CourseCard key={c.id} course={c} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
