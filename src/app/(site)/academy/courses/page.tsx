import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { db } from "@/lib/db";
import { listCourses, courseProgressFor } from "@/server/services/courses";
import { getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/section";
import { CourseCard } from "@/components/courses/course-card";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Course Catalog", description: "Search and filter financial crime courses by topic, level, duration, access and certificate." };
export const dynamic = "force-dynamic";

type SP = Record<string, string | undefined>;

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const [topics, result, user] = await Promise.all([
    db.topic.findMany({ orderBy: { order: "asc" } }),
    listCourses({ q: sp.q, topic: sp.topic, level: sp.level, access: sp.access, duration: sp.duration, certificate: sp.certificate, format: sp.format, page }),
    getCurrentUser(),
  ]);
  let enrolled = new Set<string>();
  let progress: Record<string, { pct: number }> = {};
  if (user) {
    const ids = result.items.map((c) => c.id);
    enrolled = new Set((await db.enrollment.findMany({ where: { userId: user.id, courseId: { in: ids } }, select: { courseId: true } })).map((e) => e.courseId));
    progress = await courseProgressFor(user.id, [...enrolled]);
  }
  const qs = (over: SP) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...over })) if (v) p.set(k, v);
    return `/academy/courses?${p.toString()}`;
  };
  const active = ["q", "topic", "level", "access", "duration", "certificate", "format"].filter((k) => sp[k]);
  return (
    <>
      <PageHeader eyebrow="Academy" title="Course Catalog" description="Search the catalog and filter by topic, level, duration, access type, certificate availability and format." />
      <div className="container grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
        <aside aria-label="Filters">
          <form method="get" action="/academy/courses" className="card sticky top-20 space-y-4 p-5">
            <p className="flex items-center gap-2 font-semibold"><SlidersHorizontal className="h-4 w-4 text-accent" aria-hidden /> Filters</p>
            <div><label htmlFor="q" className="label">Keywords</label><Input id="q" name="q" defaultValue={sp.q} placeholder="e.g. beneficial ownership" /></div>
            <div><label htmlFor="topic" className="label">Topic</label>
              <Select id="topic" name="topic" defaultValue={sp.topic ?? ""}><option value="">All topics</option>{topics.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</Select></div>
            <div><label htmlFor="level" className="label">Level</label>
              <Select id="level" name="level" defaultValue={sp.level ?? ""}><option value="">All levels</option><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></Select></div>
            <div><label htmlFor="duration" className="label">Duration</label>
              <Select id="duration" name="duration" defaultValue={sp.duration ?? ""}><option value="">Any duration</option><option value="short">Up to 1.5 hours</option><option value="medium">1.5 – 2 hours</option><option value="long">Over 2 hours</option></Select></div>
            <div><label htmlFor="access" className="label">Access</label>
              <Select id="access" name="access" defaultValue={sp.access ?? ""}><option value="">Free and Premium</option><option value="FREE">Free</option><option value="PREMIUM">Premium</option></Select></div>
            <div><label htmlFor="format" className="label">Format</label>
              <Select id="format" name="format" defaultValue={sp.format ?? ""}><option value="">All formats</option><option value="SELF_PACED">Self-paced</option><option value="BLENDED">Blended (case-based)</option><option value="READING">Reading</option><option value="VIDEO">Video</option></Select></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="certificate" value="yes" defaultChecked={sp.certificate === "yes"} className="accent-[#193B68]" /> Certificate available</label>
            <div className="flex gap-2 pt-1"><Button type="submit" className="flex-1">Apply</Button>{active.length > 0 && <Link href="/academy/courses" className="grid place-items-center rounded-lg px-3 text-sm text-muted hover:bg-surface-2">Clear</Link>}</div>
          </form>
        </aside>
        <section aria-live="polite">
          <p className="mb-5 text-sm text-muted">{result.total} course{result.total === 1 ? "" : "s"} found</p>
          {result.items.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((c) => <CourseCard key={c.id} course={c} enrolled={enrolled.has(c.id)} progress={progress[c.id]?.pct} />)}
            </div>
          ) : (
            <EmptyState icon={SearchX} title="No courses match your filters" description="Try removing a filter or searching for a broader term." action={<Link href="/academy/courses" className="text-sm font-semibold text-brand">Clear all filters</Link>} />
          )}
          <Pagination page={result.page} pages={result.pages} makeHref={(p) => qs({ page: String(p) })} />
        </section>
      </div>
    </>
  );
}
