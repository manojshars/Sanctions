import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Download, Users } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { managedOrgs, orgReport } from "@/server/services/corporate";
import { AssignForm, CreateOrgForm, InquiryForm, InviteForm, RemoveMemberButton } from "@/components/corporate/corporate-forms";
import { Stat, Progress, Alert, EmptyState } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Corporate dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CorporateDashboard({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser("/corporate/dashboard");
  const orgs = await managedOrgs(user.id);
  if (!orgs.length) {
    return (
      <div className="container max-w-2xl py-12">
        <h1 className="text-3xl font-bold">Corporate dashboard</h1>
        <p className="mt-2 text-muted">You don&apos;t manage an organisation yet. Create one to start inviting learners; our team will activate Corporate membership for your seats.</p>
        <div className="card mt-6 p-6"><CreateOrgForm /></div>
      </div>
    );
  }
  const org = orgs.find((o) => o.id === sp.org) ?? orgs[0];
  const r = await orgReport(user.id, org.id);
  const courses = await db.course.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true }, orderBy: { title: "asc" } });
  const hasPlan = r.org.memberships.length > 0;
  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Corporate dashboard</p><h1 className="mt-1 text-3xl font-bold">{r.org.name}</h1><p className="text-sm text-muted">{r.members.length} of {r.org.seatLimit} seats used</p></div>
        <div className="flex items-center gap-2">
          {orgs.length > 1 && <form className="flex gap-2"><select name="org" defaultValue={org.id} className="input w-auto" aria-label="Organisation">{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select><button className="rounded-lg border border-line px-3 text-sm">Switch</button></form>}
          <a href={`/corporate-report?org=${org.id}`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-navy px-4 text-sm font-medium text-white dark:bg-gold-400 dark:text-navy"><Download className="h-4 w-4" /> Export CSV report</a>
        </div>
      </div>
      {!hasPlan && <Alert tone="warning" className="mt-6">This organisation does not have an active Corporate membership. Learners can access assigned courses; full-catalog access is enabled once your membership is activated. <Link href="/corporate#inquiry" className="underline">Contact us</Link>.</Alert>}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Learners" value={r.summary.learners} icon={Users} />
        <Stat label="Assignments" value={r.summary.assignments} />
        <Stat label="Completed" value={r.summary.completed} icon={CheckCircle2} />
        <Stat label="Overdue" value={r.summary.overdue} icon={AlertTriangle} />
        <Stat label="Completion rate" value={`${r.summary.completionRate}%`} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <h2 className="border-b border-line px-5 py-4 font-semibold">Assignment progress</h2>
            {r.rows.length ? (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="bg-surface-2 text-left text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-2.5">Learner</th><th className="px-4 py-2.5">Course</th><th className="px-4 py-2.5">Due</th><th className="px-4 py-2.5">Progress</th><th className="px-4 py-2.5">Final</th><th className="px-4 py-2.5">Status</th></tr></thead>
                <tbody className="divide-y divide-line">{r.rows.map((row) => (
                  <tr key={row.assignmentId}>
                    <td className="px-4 py-2.5"><span className="font-medium">{row.name}</span><span className="block text-xs text-muted">{row.email}</span></td>
                    <td className="px-4 py-2.5">{row.course.title}</td>
                    <td className="px-4 py-2.5 text-muted">{row.dueDate ? formatDate(row.dueDate) : "—"}</td>
                    <td className="w-40 px-4 py-2.5"><Progress value={row.progressPct} tone="gold" label={`${row.name} progress`} /><span className="text-xs text-muted">{row.progressPct}%</span></td>
                    <td className="px-4 py-2.5">{row.bestFinalScore != null ? `${row.bestFinalScore}%` : "—"}</td>
                    <td className="px-4 py-2.5">{row.completed ? <Badge tone="success">Completed</Badge> : row.overdue ? <Badge tone="danger">Overdue</Badge> : row.enrolled ? <Badge tone="brand">In progress</Badge> : <Badge tone="outline">Not started</Badge>}</td>
                  </tr>))}</tbody>
              </table></div>
            ) : <EmptyState className="m-5" title="No assignments yet" description="Assign a course to your learners to start tracking progress." />}
          </section>
          <section className="card overflow-hidden">
            <h2 className="border-b border-line px-5 py-4 font-semibold">Team members & assessment performance</h2>
            <ul className="divide-y divide-line">{r.members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <div className="min-w-0 flex-1"><p className="font-medium">{m.user.name} {m.role === "MANAGER" && <Badge tone="gold">Manager</Badge>}</p><p className="text-xs text-muted">{m.user.email} · joined {formatDate(m.joinedAt)} · last login {formatDate(m.user.lastLoginAt)}</p></div>
                <span className="text-xs text-muted">{m.completed}/{m.assigned} completed · {m.assessments} assessments{m.avgScore != null ? ` · avg ${m.avgScore}%` : ""}</span>
                {m.userId !== user.id && <RemoveMemberButton orgId={org.id} userId={m.userId} />}
              </li>))}</ul>
            {r.invitations.length > 0 && <div className="border-t border-line px-5 py-3 text-xs text-muted">Pending invitations: {r.invitations.map((i) => i.email).join(", ")}</div>}
          </section>
        </div>
        <aside className="space-y-6">
          <section className="card p-5"><h2 className="mb-3 font-semibold">Assign a course</h2><AssignForm orgId={org.id} courses={courses} members={r.members.map((m) => ({ userId: m.userId, name: m.user.name }))} /></section>
          <section className="card p-5"><h2 className="mb-3 font-semibold">Invite team members</h2><InviteForm orgId={org.id} /></section>
          <section className="card p-5"><h2 className="mb-3 font-semibold">Request a customised workshop</h2><InquiryForm type="WORKSHOP" defaults={{ name: user.name, email: user.email, company: r.org.name }} /></section>
          <section className="card p-5 text-sm"><h2 className="font-semibold">Corporate support</h2><p className="mt-1 text-muted">Questions about seats, billing or reporting? <Link href="/support/new?category=Payments%20and%20Membership" className="text-brand underline">Open a support ticket</Link>.</p></section>
        </aside>
      </div>
    </div>
  );
}
