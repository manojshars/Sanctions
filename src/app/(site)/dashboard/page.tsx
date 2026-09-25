import type { Metadata } from "next";
import Link from "next/link";
import { Award, Bell, BookOpen, CalendarClock, CheckCircle2, ClipboardList, Layers, PlayCircle, Sparkles, Target } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getEntitlements, tierLabel } from "@/lib/entitlements";
import { dashboardData, recommendCourses } from "@/server/services/dashboard";
import { flashcardOfTheDay, flashcardStats } from "@/server/services/flashcards";
import { attemptPath } from "@/lib/paths";
import { Alert, EmptyState, Progress, Stat } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { FlipCard } from "@/components/flashcards/flip-card";
import { QuickStart } from "@/components/practice/start-forms";
import { formatDate } from "@/lib/utils";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ welcome?: string; denied?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser("/dashboard");
  const [d, recs, fc, ent, fotd, topics] = await Promise.all([dashboardData(user), recommendCourses(user, 3), flashcardStats(user.id), getEntitlements(user), flashcardOfTheDay(), db.topic.findMany()]);
  const active = d.enrollments.filter((e) => e.status === "ACTIVE");
  const tname = (s: string) => topics.find((t) => t.slug === s)?.name ?? s;
  const weakest = [...d.stats].filter((s) => s.total >= 3).sort((a, b) => a.accuracy - b.accuracy)[0];
  const first = user.name.split(" ")[0];
  return (
    <div className="container py-10">
      {sp.welcome && <Alert tone="success" title="Welcome to FinCrime Academy" className="mb-6">Your account is ready. We&apos;ve sent a verification link to your email. Start with a recommended course or a quick practice session.</Alert>}
      {sp.denied && <Alert tone="warning" className="mb-6">You don&apos;t have permission to view that page.</Alert>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Learner dashboard</p>
          <h1 className="mt-1 text-3xl font-bold">Welcome back, {first}</h1>
          <p className="mt-1 text-muted">Membership: <span className="font-medium text-ink">{tierLabel(ent)}</span>{ent.tier === "FREE" && <> · <Link href="/pricing" className="text-brand underline">Upgrade</Link></>}</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/my-learning" variant="secondary">My Learning</ButtonLink>
          <ButtonLink href="/question-bank">Practise now</ButtonLink>
        </div>
      </div>

      <section aria-label="Key statistics" className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Enrolled courses" value={d.enrollments.length} icon={BookOpen} hint={`${d.enrollments.filter((e) => e.status === "COMPLETED").length} completed`} />
        <Stat label="Questions attempted" value={d.answered} icon={ClipboardList} />
        <Stat label="Accuracy" value={d.accuracy != null ? `${d.accuracy}%` : "—"} icon={Target} />
        <Stat label="Flashcards due" value={fc.dueToday} icon={CalendarClock} />
        <Stat label="Cards mastered" value={fc.mastered} icon={Layers} />
        <Stat label="Certificates" value={d.certificates.length} icon={Award} />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Continue learning</h2><Link href="/my-learning" className="text-sm font-semibold text-brand hover:underline">All courses</Link></div>
            {active.length ? (
              <ul className="mt-4 space-y-4">
                {active.slice(0, 4).map((e) => (
                  <li key={e.id} className="flex flex-col gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{e.course.title}</p>
                      <p className="text-xs text-muted">{e.lastLesson ? `Last viewed: ${e.lastLesson.title}` : "Not started"} · {e.progress?.done ?? 0}/{e.progress?.total ?? 0} lessons</p>
                      <Progress value={e.progress?.pct ?? 0} tone="gold" className="mt-2" label={`${e.course.title} progress`} />
                    </div>
                    <ButtonLink size="sm" href={e.lastLesson ? `/academy/courses/${e.course.slug}/lessons/${e.lastLesson.slug}` : `/academy/courses/${e.course.slug}`}><PlayCircle className="h-4 w-4" /> Resume</ButtonLink>
                  </li>
                ))}
              </ul>
            ) : <EmptyState className="mt-4" icon={BookOpen} title="No active courses" description="Enrol in a course to track your progress here." action={<ButtonLink href="/academy/courses">Browse courses</ButtonLink>} />}
          </section>

          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-accent" /> Recommended for you</h2>
            <p className="text-sm text-muted">Based on your interests, level, progress and practice results.</p>
            {recs.length ? (
              <ul className="mt-4 grid gap-3 md:grid-cols-3">
                {recs.map((r) => (
                  <li key={r.course.id} className="flex flex-col rounded-xl border border-line p-4">
                    <div className="flex gap-2"><Badge tone="brand">{r.course.topic.shortName}</Badge><LevelBadge level={r.course.level} /></div>
                    <Link href={`/academy/courses/${r.course.slug}`} className="mt-2 font-semibold hover:text-brand">{r.course.title}</Link>
                    <p className="mt-1 flex-1 text-xs text-muted">{r.reasons[0]}</p>
                    {!r.accessible && <p className="mt-2 text-xs font-medium text-accent">Premium</p>}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-muted">Set your interests in your <Link href="/profile" className="text-brand underline">profile</Link> or complete a practice session to get recommendations.</p>}
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="card p-6">
              <h2 className="font-bold">Assessment accuracy by topic</h2>
              {d.stats.length ? (
                <ul className="mt-4 space-y-3">{d.stats.slice(0, 6).map((s) => <li key={s.topic}><div className="mb-1 flex justify-between text-sm"><span>{tname(s.topic)}</span><span className="text-muted">{s.accuracy}%</span></div><Progress value={s.accuracy} label={`${tname(s.topic)} accuracy`} tone={s.accuracy >= 75 ? "success" : "brand"} /></li>)}</ul>
              ) : <p className="mt-3 text-sm text-muted">No practice yet.</p>}
              {weakest && <QuickStart className="mt-5" fields={{ mode: "TOPIC_MASTERY", topic: weakest.topic }} label={`Improve ${tname(weakest.topic)}`} variant="secondary" size="sm" />}
            </div>
            <div className="card p-6">
              <h2 className="font-bold">Mock exam history</h2>
              {d.exams.length ? (
                <ul className="mt-3 divide-y divide-line text-sm">{d.exams.map((a) => <li key={a.id}><Link href={attemptPath(a.kind, a.id, a.status !== "IN_PROGRESS")} className="flex justify-between py-2.5 hover:text-brand"><span>{a.assessment?.name}<span className="block text-xs text-muted">{formatDate(a.startedAt)}</span></span><span className="font-semibold">{a.status === "IN_PROGRESS" ? "In progress" : `${a.score}%`}</span></Link></li>)}</ul>
              ) : <p className="mt-3 text-sm text-muted">No mock exams yet.</p>}
              <ButtonLink href="/mock-exams" size="sm" variant="secondary" className="mt-4">Mock Exam Center</ButtonLink>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <div className="flex items-center justify-between"><h2 className="font-bold">Flashcards</h2><Link href="/flashcards" className="text-sm font-semibold text-brand">Library</Link></div>
            <p className="mt-1 text-sm text-muted">{fc.dueToday} due today · {fc.upcoming} upcoming this week · {fc.needsRevision} need revision</p>
            <ButtonLink href="/flashcards/review" variant="gold" className="mt-4 w-full">Start daily review</ButtonLink>
            {fotd && <div className="mt-5"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Flashcard of the Day</p><FlipCard front={fotd.front} back={fotd.back} explanation={fotd.explanation} topic={fotd.deck.topic?.name} /></div>}
          </section>
          <section className="card p-6">
            <h2 className="font-bold">Saved items</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex justify-between"><Link href="/question-bank/browse?saved=1" className="hover:text-brand">Bookmarked questions</Link><span className="font-semibold">{d.bookmarkedQuestions}</span></li>
              <li className="flex justify-between"><Link href="/videos?saved=1" className="hover:text-brand">Saved videos</Link><span className="font-semibold">{d.videos.length}</span></li>
              <li className="flex justify-between"><Link href="/certificates" className="hover:text-brand">Certificates earned</Link><span className="font-semibold">{d.certificates.length}</span></li>
            </ul>
            {d.videos.length > 0 && <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm">{d.videos.map((v) => <li key={v.id}><Link href={`/videos/${v.id}`} className="line-clamp-1 hover:text-brand">{v.title}</Link></li>)}</ul>}
          </section>
          <section className="card p-6">
            <h2 className="font-bold">Recent activity</h2>
            {d.activity.length ? (
              <ol className="mt-3 space-y-3 text-sm">{d.activity.map((a, i) => <li key={i} className="flex gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span>{a.href ? <Link href={a.href} className="hover:text-brand">{a.text}</Link> : a.text}<span className="block text-xs text-muted">{formatDate(a.at)}</span></span></li>)}</ol>
            ) : <p className="mt-2 text-sm text-muted">Your learning activity will appear here.</p>}
          </section>
          {d.notifications.length > 0 && (
            <section className="card p-6">
              <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold"><Bell className="h-4 w-4" /> Notifications</h2><Link href="/notifications" className="text-sm font-semibold text-brand">All</Link></div>
              <ul className="mt-3 space-y-2 text-sm">{d.notifications.slice(0, 3).map((n) => <li key={n.id} className={n.readAt ? "text-muted" : ""}>{n.title}</li>)}</ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
