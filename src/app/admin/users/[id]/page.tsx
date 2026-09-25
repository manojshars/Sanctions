import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getEntitlements, tierLabel } from "@/lib/entitlements";
import { courseProgressFor } from "@/server/services/courses";
import { AdminHeader, Flash, Table, Td, ActionButton, L } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/form";
import { adminEnrollAction, grantMembershipAction, revokeMembershipAction, setRoleAction, setStatusAction } from "@/server/actions/admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "User" };

export default async function AdminUser({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const actor = await requirePermission("users:manage");
  const { id } = await params;
  const sp = await searchParams;
  const u = await db.user.findUnique({
    where: { id },
    include: {
      enrollments: { include: { course: { select: { title: true } } } }, memberships: { include: { plan: true, package: true }, orderBy: { createdAt: "desc" } },
      tickets: { orderBy: { createdAt: "desc" }, take: 10 }, certificates: true, orgMemberships: { include: { org: true } }, payments: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { attempts: true, flashcardReviews: true } },
    },
  });
  if (!u) notFound();
  const [ent, progress, plans, packages, courses] = await Promise.all([
    getEntitlements(u), courseProgressFor(u.id, u.enrollments.map((e) => e.courseId)),
    db.membershipPlan.findMany({ where: { tier: { not: "FREE" } } }), db.learningPackage.findMany(), db.course.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);
  const self = actor.id === u.id;
  return (
    <>
      <AdminHeader title={u.name} back={{ href: "/admin/users", label: "Users" }} description={`${u.email} · joined ${formatDate(u.createdAt)} · last login ${formatDate(u.lastLoginAt)} · access: ${tierLabel(ent)}`}
        actions={!self && <><StatusBadge status={u.status} />{u.status === "ACTIVE" ? <ActionButton action={setStatusAction.bind(null, u.id, "SUSPENDED")} label="Suspend" tone="danger" /> : u.status === "SUSPENDED" ? <ActionButton action={setStatusAction.bind(null, u.id, "ACTIVE")} label="Reactivate" /> : null}</>} />
      <Flash sp={sp} />
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card space-y-4 p-5">
          <h2 className="font-semibold">Role</h2>
          {self ? <p className="text-sm text-muted">You cannot change your own role.</p> : (
            <form action={setRoleAction.bind(null, u.id)} className="flex gap-2"><Select name="role" defaultValue={u.role} aria-label="Role">{["LEARNER", "EDITOR", "SUPPORT", "ADMIN"].map((r) => <option key={r}>{r}</option>)}</Select><button className="rounded-lg border border-line px-3 text-sm">Update</button></form>
          )}
          <p className="text-xs text-muted">Role changes sign the user out of all sessions.</p>
          <h2 className="pt-2 font-semibold">Organisations</h2>
          <ul className="text-sm">{u.orgMemberships.map((m) => <li key={m.id}>{m.org.name} ({m.role.toLowerCase()})</li>)}{!u.orgMemberships.length && <li className="text-muted">None</li>}</ul>
          <p className="text-sm text-muted">{u._count.attempts} assessment sessions · {u._count.flashcardReviews} flashcards reviewed · {u.certificates.length} certificates</p>
        </section>
        <section className="card space-y-4 p-5">
          <h2 className="font-semibold">Memberships</h2>
          <ul className="space-y-2 text-sm">{u.memberships.map((m) => <li key={m.id} className="flex items-center justify-between gap-2"><span>{m.plan?.name ?? m.package?.name} <span className="text-xs text-muted">({m.source.toLowerCase()}{m.endsAt ? `, ends ${formatDate(m.endsAt)}` : ""})</span></span><span className="flex items-center gap-2"><StatusBadge status={m.status} />{m.status === "ACTIVE" && <ActionButton action={revokeMembershipAction.bind(null, `/admin/users/${u.id}`, m.id)} label="Revoke" tone="danger" />}</span></li>)}{!u.memberships.length && <li className="text-muted">Free plan</li>}</ul>
          <form action={grantMembershipAction.bind(null, u.id)} className="space-y-2 border-t border-line pt-4">
            <L label="Grant access" htmlFor="product"><Select id="product" name="product">{plans.map((p) => <option key={p.id} value={`plan:${p.slug}`}>Plan: {p.name}</option>)}{packages.map((p) => <option key={p.id} value={`package:${p.slug}`}>Package: {p.name}</option>)}</Select></L>
            <div className="grid grid-cols-2 gap-2"><L label="Days (blank = default)" htmlFor="days"><Input id="days" name="days" type="number" min={1} /></L><L label="Source" htmlFor="source"><Select id="source" name="source"><option value="ADMIN">Admin grant</option><option value="SCHOLARSHIP">Scholarship</option></Select></L></div>
            <button className="h-9 rounded-lg bg-navy px-3 text-sm text-white dark:bg-gold-400 dark:text-navy">Grant</button>
          </form>
        </section>
        <section className="card space-y-3 p-5">
          <h2 className="font-semibold">Support history</h2>
          <ul className="space-y-1 text-sm">{u.tickets.map((t) => <li key={t.id} className="flex justify-between"><Link href={`/admin/support/${t.number}`} className="text-brand hover:underline">#{t.number} {t.subject}</Link><StatusBadge status={t.status} /></li>)}{!u.tickets.length && <li className="text-muted">No tickets</li>}</ul>
          <h2 className="pt-2 font-semibold">Recent payments</h2>
          <ul className="space-y-1 text-sm">{u.payments.map((p) => <li key={p.id} className="flex justify-between"><span>{p.description}</span><StatusBadge status={p.status} /></li>)}{!u.payments.length && <li className="text-muted">None</li>}</ul>
        </section>
      </div>
      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Course enrolment & progress</h2>
          <form action={adminEnrollAction.bind(null, u.id)} className="flex gap-2"><Select name="courseId" aria-label="Course">{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select><button className="whitespace-nowrap rounded-lg border border-line px-3 text-sm">Enrol user</button></form></div>
        <Table head={["Course", "Source", "Enrolled", "Progress", "Status"]}>{u.enrollments.map((e) => <tr key={e.id}><Td>{e.course.title}</Td><Td>{e.source.toLowerCase()}</Td><Td>{formatDate(e.enrolledAt)}</Td><Td>{progress[e.courseId]?.pct ?? 0}%</Td><Td><StatusBadge status={e.status} /></Td></tr>)}</Table>
      </section>
    </>
  );
}
