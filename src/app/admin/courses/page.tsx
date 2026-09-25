import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Flash, Table, Td, ActionButton } from "@/components/admin/ui";
import { StatusBadge, TierBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { reviewModerationAction } from "@/server/actions/admin";

export const metadata = { title: "Courses" };

export default async function AdminCourses({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; saved?: string; error?: string }> }) {
  await requirePermission("content:manage");
  const sp = await searchParams;
  const courses = await db.course.findMany({
    where: { ...(sp.q ? { title: { contains: sp.q, mode: "insensitive" } } : {}), ...(sp.status ? { status: sp.status as never } : {}) },
    include: { topic: true, _count: { select: { modules: true, enrollments: true } } }, orderBy: { updatedAt: "desc" },
  });
  const reviews = await db.courseReview.findMany({ where: { status: "IN_REVIEW" }, include: { course: { select: { title: true } }, user: { select: { name: true } } }, take: 20 });
  return (
    <>
      <AdminHeader title="Course management" description={`${courses.length} courses`} actions={<ButtonLink href="/admin/courses/new">New course</ButtonLink>} />
      <Flash sp={sp} />
      <form className="mb-4 flex gap-2"><input name="q" defaultValue={sp.q} placeholder="Search courses" className="input max-w-xs" aria-label="Search courses" /><select name="status" defaultValue={sp.status ?? ""} className="input w-auto" aria-label="Status"><option value="">All statuses</option><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select><button className="rounded-lg border border-line px-3 text-sm">Filter</button></form>
      <Table head={["Course", "Topic", "Level", "Access", "Modules", "Enrolments", "Status"]}>
        {courses.map((c) => <tr key={c.id}><Td><Link href={`/admin/courses/${c.id}`} className="font-medium text-brand hover:underline">{c.title}</Link></Td><Td>{c.topic.shortName}</Td><Td>{c.level}</Td><Td><TierBadge tier={c.accessTier} /></Td><Td>{c._count.modules}</Td><Td>{c._count.enrollments}</Td><Td><StatusBadge status={c.status} /></Td></tr>)}
      </Table>
      {reviews.length > 0 && (
        <section className="mt-8"><h2 className="mb-3 font-semibold">Learner reviews awaiting moderation</h2>
          <Table head={["Course", "Learner", "Rating", "Comment", ""]}>{reviews.map((r) => <tr key={r.id}><Td>{r.course.title}</Td><Td>{r.user.name}</Td><Td>{r.rating}/5</Td><Td>{r.comment}</Td><Td className="flex gap-2"><ActionButton action={reviewModerationAction.bind(null, r.id, "PUBLISHED")} label="Approve" tone="primary" /><ActionButton action={reviewModerationAction.bind(null, r.id, "ARCHIVED")} label="Reject" tone="danger" /></Td></tr>)}</Table>
        </section>
      )}
    </>
  );
}
