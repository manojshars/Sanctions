import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Lightbulb } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { AccessError, NotFoundError, getLessonForLearner } from "@/server/services/courses";
import { Prose } from "@/components/ui/prose";
import { Progress } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { CompleteLessonButton, ExerciseNotes, KnowledgeCheckButton, ProgressTracker } from "@/components/courses/lesson-client";
import { YouTubeEmbed } from "@/components/videos/youtube-embed";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { robots: { index: false } };

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lesson: string }> }) {
  const { slug, lesson: lessonSlug } = await params;
  const user = await requireUser(`/academy/courses/${slug}/lessons/${lessonSlug}`);
  let data;
  try {
    data = await getLessonForLearner(user, slug, lessonSlug);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    if (e instanceof AccessError) redirect(`/academy/courses/${slug}?access=denied`);
    throw e;
  }
  const { course, lesson, flat, index, prev, next, progress } = data;
  const done = new Set(progress.filter((p) => p.status === "COMPLETED").map((p) => p.lessonId));
  const mine = progress.find((p) => p.lessonId === lesson.id);
  const pct = Math.round((done.size / flat.length) * 100);
  const nextHref = next ? `/academy/courses/${course.slug}/lessons/${next.slug}` : null;
  const isLastModuleLesson = !next || next.moduleId !== flat[index].moduleId;

  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-[300px_1fr]">
      <ProgressTracker lessonId={lesson.id} initial={mine?.progressPercent ?? 0} />
      <aside className="lg:sticky lg:top-20 lg:self-start" aria-label="Course navigation">
        <Link href={`/academy/courses/${course.slug}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Course overview</Link>
        <p className="mt-3 font-semibold leading-snug">{course.title}</p>
        <div className="mt-2 flex justify-between text-xs text-muted"><span>{done.size}/{flat.length} complete</span><span>{pct}%</span></div>
        <Progress value={pct} tone="gold" className="mt-1" />
        <nav className="mt-5 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {course.modules.map((m, mi) => (
            <div key={m.id}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Module {mi + 1} · {m.title}</p>
              <ul className="mt-1.5 space-y-0.5">
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    <Link href={`/academy/courses/${course.slug}/lessons/${l.slug}`} aria-current={l.id === lesson.id ? "page" : undefined}
                      className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm", l.id === lesson.id ? "bg-navy text-white dark:bg-gold-400/15 dark:text-ink" : "hover:bg-surface-2")}>
                      {done.has(l.id) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-label="Completed" /> : <Circle className="h-4 w-4 shrink-0 opacity-40" aria-hidden />}
                      <span className="line-clamp-2">{l.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <article className="min-w-0">
        <p className="eyebrow">{flat[index].moduleTitle} · Lesson {index + 1} of {flat.length}</p>
        <h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1>
        <p className="mt-1 text-sm text-muted">{lesson.durationMinutes} min {lesson.type === "EXERCISE" ? "· includes a practical exercise" : ""}</p>
        {lesson.video && !lesson.video.unavailable && <div className="mt-6"><YouTubeEmbed youtubeId={lesson.video.youtubeId} title={lesson.video.title} /></div>}
        <div id="lesson-body" className="card mt-6 p-6 sm:p-8"><Prose markdown={lesson.content} /></div>
        {lesson.exercise && (
          <section className="mt-6 rounded-2xl border border-gold-400/40 bg-gold-400/5 p-6" aria-labelledby="exercise-h">
            <h2 id="exercise-h" className="flex items-center gap-2 font-semibold"><Lightbulb className="h-5 w-5 text-accent" /> Practical exercise</h2>
            <p className="mt-2 text-ink/85">{lesson.exercise}</p>
            <ExerciseNotes lessonId={lesson.id} />
          </section>
        )}
        {isLastModuleLesson && (
          <section className="card mt-6 flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-semibold">Knowledge check</h2><p className="text-sm text-muted">Test your understanding with a short, instantly-marked quiz.</p></div>
            <KnowledgeCheckButton courseId={course.id} />
          </section>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          {prev ? <ButtonLink href={`/academy/courses/${course.slug}/lessons/${prev.slug}`} variant="secondary"><ArrowLeft className="h-4 w-4" /> Previous</ButtonLink> : <span />}
          <div className="flex items-center gap-3">
            <CompleteLessonButton lessonId={lesson.id} nextHref={nextHref} completed={done.has(lesson.id)} />
            {!next && done.has(lesson.id) && <ButtonLink href={`/academy/courses/${course.slug}`} variant="secondary">Course overview <ArrowRight className="h-4 w-4" /></ButtonLink>}
          </div>
        </div>
      </article>
    </div>
  );
}
