import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getEntitlements, tierLabel } from "@/lib/entitlements";
import { CancelMembership } from "@/components/billing/billing-forms";
import { StatusBadge } from "@/components/ui/badge";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser("/settings/billing");
  const [memberships, payments, ent] = await Promise.all([
    db.membership.findMany({ where: { userId: user.id }, include: { plan: true, package: true }, orderBy: { createdAt: "desc" } }),
    db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    getEntitlements(user),
  ]);
  return (
    <div className="container max-w-4xl space-y-6 py-10">
      <div><p className="eyebrow">Account</p><h1 className="mt-1 text-3xl font-bold">Billing & membership</h1><p className="mt-1 text-muted">Current access: <strong>{tierLabel(ent)}</strong></p></div>
      {sp.success && <Alert tone="success" title="Thank you!">Your payment was successful and your access is now active.</Alert>}
      <section className="card p-6">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Memberships</h2><ButtonLink href="/pricing" size="sm" variant="secondary">View plans</ButtonLink></div>
        {memberships.length ? (
          <ul className="mt-4 divide-y divide-line">{memberships.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div><p className="font-semibold">{m.plan?.name ?? m.package?.name ?? "Membership"}</p><p className="text-xs text-muted">Started {formatDate(m.startsAt)}{m.endsAt ? ` · ${m.cancelAtPeriodEnd || !m.plan || m.plan.interval === "ONE_TIME" ? "ends" : "renews"} ${formatDate(m.endsAt)}` : ""} · source: {m.source.toLowerCase()}</p></div>
              <div className="flex items-center gap-2"><StatusBadge status={m.status} />{m.status === "ACTIVE" && m.plan && m.plan.interval !== "ONE_TIME" && !m.cancelAtPeriodEnd && m.source === "PURCHASE" && <CancelMembership id={m.id} />}{m.cancelAtPeriodEnd && <span className="text-xs text-muted">Will not renew</span>}</div>
            </li>))}</ul>
        ) : <p className="mt-3 text-sm text-muted">You&apos;re on the Free plan.</p>}
      </section>
      <section className="card p-6">
        <h2 className="font-semibold">Payment history</h2>
        {payments.length ? (
          <div className="mt-4 overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted"><tr><th className="py-2">Date</th><th>Description</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody className="divide-y divide-line">{payments.map((p) => <tr key={p.id}><td className="py-2.5">{formatDate(p.createdAt)}</td><td>{p.description}</td><td>{formatMoney(p.amountCents, p.currency)}</td><td><StatusBadge status={p.status} /></td><td className="text-right">{p.status === "SUCCEEDED" && <Link href={`/settings/billing/invoices/${p.id}`} className="font-semibold text-brand">Invoice</Link>}</td></tr>)}</tbody>
          </table></div>
        ) : <EmptyState className="mt-4 py-8" title="No payments yet" />}
      </section>
    </div>
  );
}
