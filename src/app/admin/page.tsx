import Link from "next/link";
import { Activity, Award, BookOpen, CreditCard, GraduationCap, LifeBuoy, UserPlus, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac";
import { platformAnalytics } from "@/server/services/admin/analytics";
import { AdminHeader, Table, Td } from "@/components/admin/ui";
import { Stat, Progress, Alert } from "@/components/ui/feedback";
import { formatMoney, titleCase } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const user = await requirePermission("analytics:view");
  const a = await platformAnalytics();
  const maxPop = Math.max(1, ...a.popular.map((p) => p.enrollments + p.answers));
  const hrs = (h: number | null) => (h == null ? "—" : h < 1 ? `${Math.round(h * 60)} min` : `${h.toFixed(1)} h`);
  return (
    <>
      <AdminHeader title="Platform analytics" description="All figures are computed live from the database." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Registered users" value={a.users} icon={Users} hint={`${a.newUsers} new in last 30 days`} />
        <Stat label="Active learners (30 days)" value={a.activeLearners} icon={Activity} />
        <Stat label="Course enrolments" value={a.enrollments} icon={BookOpen} />
        <Stat label="Course completions" value={a.completions} icon={GraduationCap} hint={`${a.completionRate}% completion rate`} />
        <Stat label="Certificates issued" value={a.certificates} icon={Award} />
        <Stat label="Open tickets" value={a.ticket.open} icon={LifeBuoy} hint={`Avg first response ${hrs(a.ticket.avgFirstResponseHours)} · resolution ${hrs(a.ticket.avgResolutionHours)}`} />
        {can(user.role, "revenue:view") && <Stat label="Subscription revenue" value={formatMoney(a.revenueCents)} icon={CreditCard} hint={`${formatMoney(a.revenue30Cents)} last 30 days · ${a.activePaid} active paid`} />}
        <Stat label="New inquiries" value={a.openInquiries} icon={UserPlus} hint={`${a.pendingAssistance} fee-assistance requests pending`} />
      </div>
      {can(user.role, "revenue:view") && a.devPayments.count > 0 && <Alert tone="warning" className="mt-4">{a.devPayments.count} development-mode (simulated) payment(s) totalling {formatMoney(a.devPayments.cents)} are excluded from revenue.</Alert>}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold">Assessment performance</h2>
          {a.assessments.length ? (
            <Table head={["Type", "Completed", "Average score"]} className="mt-3 shadow-none">
              {a.assessments.map((k) => <tr key={k.kind}><Td>{titleCase(k.kind)}</Td><Td>{k.count}</Td><Td>{k.avgScore != null ? `${k.avgScore}%` : "—"}</Td></tr>)}
            </Table>
          ) : <p className="mt-2 text-sm text-muted">No completed assessments yet.</p>}
        </section>
        <section className="card p-5">
          <h2 className="font-semibold">Popular topics</h2>
          <p className="text-xs text-muted">Enrolments + graded answers</p>
          <ul className="mt-3 space-y-2.5">{a.popular.map((p) => <li key={p.name}><div className="mb-1 flex justify-between text-sm"><span>{p.name}</span><span className="text-muted">{p.enrollments} enrolments · {p.answers} answers</span></div><Progress value={((p.enrollments + p.answers) / maxPop) * 100} label={p.name} tone="gold" /></li>)}</ul>
        </section>
        <section className="card p-5">
          <h2 className="font-semibold">Question bank</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">{["PUBLISHED", "IN_REVIEW", "DRAFT", "ARCHIVED"].map((s) => <div key={s} className="rounded-lg bg-surface-2 p-3"><dt className="text-xs text-muted">{titleCase(s)}</dt><dd className="text-lg font-bold">{a.questions[s] ?? 0}</dd></div>)}</dl>
          <Link href="/admin/questions?status=IN_REVIEW" className="mt-3 inline-block text-sm font-semibold text-brand">Review queue →</Link>
        </section>
        <section className="card p-5">
          <h2 className="font-semibold">Support tickets by status</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">{["OPEN", "IN_PROGRESS", "AWAITING_USER", "RESOLVED", "CLOSED"].map((s) => <div key={s} className="rounded-lg bg-surface-2 p-3"><dt className="text-xs text-muted">{titleCase(s)}</dt><dd className="text-lg font-bold">{a.ticket.byStatus[s] ?? 0}</dd></div>)}</dl>
        </section>
      </div>
    </>
  );
}
