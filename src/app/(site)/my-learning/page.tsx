import type { Metadata } from "next";
import Link from "next/link";
import { Award, BookOpen, Download, History, PlayCircle } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { dashboardData } from "@/server/services/dashboard";
import { modeLabel } from "@/server/services/attempts";
import { attemptPath } from "@/lib/paths";
import { EmptyState, Progress } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Learning", robots: { index: false } };
export const dynamic = "force-dynamic";

const TABS = [{ id: "active", label: "Active courses" }, { id: "completed", label: "Completed" }, { id: "plan", label: "Learning plan" }, { id: "assessments", label: "Assessment history" }, { id: "saved", label: "Saved resources" }];

export default async function MyLearningPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "active" } = await searchParams;
  const user = await requireUser("/my-learning");
  const d = await dashboardData(user);
  const assignments = await db.corporateAssignment.findMany({ where: { userId: user.id }, include: { course: true, org: { select: { name: true } } }, orderBy: { dueDate: "asc" } });
  const planVideos = await db.videoProgress.findMany({ where: { userId: user.id, inPlan: true }, include: { video: true } });
  const saved = await db.bookmark.findMany({ where: { userId: user.id, entityType: { in: ["COURSE", "ARTICLE", "CASE_STUDY", "GLOSSARY", "VIDEO"] } }, orderBy: { createdAt: "desc" } });
  const [sCourses, sArticles, sCases, sTerms, sVideos] = await Promise.all([
    db.course.findMany({ where: { id: { in: saved.filter((s) => s.entityType === "COURSE").map((s) => s.entityId) } }, select: { id: true, title: true, slug: true } }),
    db.article.findMany({ where: { id: { in: saved.filter((s) => s.entityType === "ARTICLE").map((s) => s.entityId) } }, select: { id: true, title: true, slug: true } }),
    db.caseStudy.findMany({ where: { id: { in: saved.filter((s) => s.entityType === "CASE_STUDY").map((s) => s.entityId) } }, select: { id: true, title: true, slug: true } }),
    db.glossaryTerm.findMany({ where: { id: { in: saved.filter((s) => s.entityType === "GLOSSARY").map((s) => s.entityId) } }, select: { id: true, term: true, slug: true } }),
    db.videoResource.findMany({ where: { id: { in: saved.filter((s) => s.entityType === "VIDEO").map((s) => s.entityId) } }, select: { id: true, title: true } }),
  ]);
  const activeList = d.enrollments.filter((e) => e.status === "ACTIVE");
  const completed = d.enrollments.filter((e) => e.status === "COMPLETED");
  return (
    <div className="container py-10">
      <p className="eyebrow">My Learning</p>
      <h1 className="mt-1 text-3xl font-bold">Your learning</h1>
      <nav aria-label="My Learning sections" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => <Link key={t.id} href={`/my-learning?tab=${t.id}`} aria-current={tab === t.id ? "page" : undefined} className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${tab === t.id ? "border-gold-400 text-ink" : "border-transparent text-muted hover:text-ink"}`}>{t.label}</Link>)}
      </nav>
      <div className="mt-8">
        {tab === "active" && (activeList.length ? (
          <ul className="grid gap-4 md:grid-cols-2">{activeList.map((e) => (
            <li key={e.id} className="card p-5">
              <div className="flex gap-2"><Badge tone="brand">{e.course.topic.shortName}</Badge>{e.source === "CORPORATE" && <Badge tone="gold">Assigned</Badge>}</div>
              <p className="mt-2 font-semibold">{e.course.title}</p>
              <p className="text-xs text-muted">Enrolled {formatDate(e.enrolledAt)} · {e.progress?.done}/{e.progress?.total} lessons</p>
              <Progress value={e.progress?.pct ?? 0} tone="gold" className="mt-3" label="Progress" />
              <ButtonLink size="sm" className="mt-4" href={e.lastLesson ? `/academy/courses/${e.course.slug}/lessons/${e.lastLesson.slug}` : `/academy/courses/${e.course.slug}`}><PlayCircle className="h-4 w-4" /> Continue</ButtonLink>
            </li>))}</ul>
        ) : <EmptyState icon={BookOpen} title="No active courses" action={<ButtonLink href="/academy/courses">Browse courses</ButtonLink>} />)}
        {tab === "completed" && (completed.length ? (
          <ul className="grid gap-4 md:grid-cols-2">{completed.map((e) => {
            const cert = d.certificates.find((c) => c.courseId === e.courseId);
            return (
              <li key={e.id} className="card p-5"><p className="font-semibold">{e.course.title}</p><p className="text-xs text-muted">Completed {formatDate(e.completedAt)}</p>
                <div className="mt-3 flex gap-2">{cert && <ButtonLink size="sm" href={`/certificates/${cert.id}`} variant="gold"><Award className="h-4 w-4" /> Certificate</ButtonLink>}<ButtonLink size="sm" variant="secondary" href={`/academy/courses/${e.course.slug}`}>Review course</ButtonLink></div>
              </li>
            );
          })}</ul>
        ) : <EmptyState icon={Award} title="No completed courses yet" description="Complete all lessons and pass the final assessment to finish a course." />)}
        {tab === "plan" && (
          <div className="space-y-6">
            <section className="card p-6"><h2 className="font-semibold">Assigned by your organisation</h2>
              {assignments.length ? <ul className="mt-3 divide-y divide-line text-sm">{assignments.map((a) => <li key={a.id} className="flex justify-between py-2.5"><Link href={`/academy/courses/${a.course.slug}`} className="hover:text-brand">{a.course.title}<span className="block text-xs text-muted">{a.org.name}</span></Link><span className="text-muted">{a.dueDate ? `Due ${formatDate(a.dueDate)}` : "No deadline"}</span></li>)}</ul> : <p className="mt-2 text-sm text-muted">No corporate assignments.</p>}
            </section>
            <section className="card p-6"><h2 className="font-semibold">Videos in your learning plan</h2>
              {planVideos.length ? <ul className="mt-3 space-y-2 text-sm">{planVideos.map((p) => <li key={p.id} className="flex justify-between"><Link href={`/videos/${p.videoId}`} className="hover:text-brand">{p.video.title}</Link>{p.watchedAt ? <Badge tone="success">Watched</Badge> : <Badge tone="outline">To watch</Badge>}</li>)}</ul> : <p className="mt-2 text-sm text-muted">Use “Add to learning plan” on any video.</p>}
            </section>
          </div>
        )}
        {tab === "assessments" && (d.attempts.length ? (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3">Assessment</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Questions</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Status</th></tr></thead>
              <tbody className="divide-y divide-line">{d.attempts.map((a) => (
                <tr key={a.id}><td className="px-4 py-3"><Link href={attemptPath(a.kind, a.id, a.status !== "IN_PROGRESS")} className="font-medium hover:text-brand">{a.kind === "KNOWLEDGE_CHECK" ? "Knowledge check" : modeLabel(a.kind, a.mode, a.assessment?.name)}</Link></td><td className="px-4 py-3 text-muted">{formatDate(a.startedAt)}</td><td className="px-4 py-3">{a.totalCount}</td><td className="px-4 py-3 font-semibold">{a.score != null ? `${a.score}%` : "—"}</td><td className="px-4 py-3"><StatusBadge status={a.status === "IN_PROGRESS" ? "IN_PROGRESS" : a.passed === false ? "FAILED" : "SUCCEEDED"} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState icon={History} title="No assessments yet" />)}
        {tab === "saved" && (saved.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[{ t: "Courses", items: sCourses.map((c) => ({ k: c.id, l: c.title, h: `/academy/courses/${c.slug}` })) },
              { t: "Articles", items: sArticles.map((c) => ({ k: c.id, l: c.title, h: `/knowledge/articles/${c.slug}` })) },
              { t: "Case studies", items: sCases.map((c) => ({ k: c.id, l: c.title, h: `/case-studies/${c.slug}` })) },
              { t: "Glossary", items: sTerms.map((c) => ({ k: c.id, l: c.term, h: `/knowledge/glossary/${c.slug}` })) },
              { t: "Videos", items: sVideos.map((c) => ({ k: c.id, l: c.title, h: `/videos/${c.id}` })) }].filter((g) => g.items.length).map((g) => (
              <section key={g.t} className="card p-5"><h2 className="font-semibold">{g.t}</h2><ul className="mt-2 space-y-1.5 text-sm">{g.items.map((i) => <li key={i.k}><Link href={i.h} className="hover:text-brand">{i.l}</Link></li>)}</ul></section>
            ))}
          </div>
        ) : <EmptyState icon={Download} title="Nothing saved yet" description="Use the Save buttons on courses, articles, case studies and videos." />)}
      </div>
    </div>
  );
}
