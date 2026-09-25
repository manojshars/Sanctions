import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { paymentMode } from "@/server/services/payments";
import { PageHeader } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { FeeAssistanceForm } from "@/components/billing/billing-forms";
import { formatMoney, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing", description: "Free, Premium and Corporate memberships and focused learning bundles." };
export const dynamic = "force-dynamic";

const COMPARE: [string, boolean | string, boolean | string, boolean | string][] = [
  ["Foundational courses", true, true, true], ["Full eligible course catalog", false, true, true], ["Practice questions", "Free set", "Expanded bank", "Expanded bank"],
  ["Mock examinations", "Quick Assessment", true, true], ["Exam readiness assessment", true, true, true], ["Flashcards & spaced repetition", "Selected decks", "Full library", "Full library"],
  ["Performance analytics", "Basic", true, true], ["Advanced case simulations", "Selected", true, true], ["Downloadable resources", "Selected", true, true],
  ["Completion certificates", "Free courses", true, true], ["Team management & assignments", false, false, true], ["Completion reports", false, false, true], ["Corporate support", false, false, true],
];

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ canceled?: string }> }) {
  const sp = await searchParams;
  const [plans, packages, user] = await Promise.all([db.membershipPlan.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }), db.learningPackage.count({ where: { isActive: true } }), getCurrentUser()]);
  const mode = paymentMode();
  const cell = (v: boolean | string) => v === true ? <Check className="mx-auto h-5 w-5 text-success" aria-label="Included" /> : v === false ? <Minus className="mx-auto h-4 w-4 text-muted" aria-label="Not included" /> : <span className="text-xs text-muted">{v}</span>;
  return (
    <>
      <PageHeader eyebrow="Pricing" title="Plans for individuals and teams" description="Start free. Upgrade when you're ready. Cancel any time." />
      <div className="container space-y-14 py-12">
        {sp.canceled && <Alert tone="info">Checkout was cancelled. You have not been charged.</Alert>}
        {mode === "development" && <Alert tone="warning" title="Development payment mode">Stripe is not configured in this environment. Checkout uses a clearly-labelled simulation so the purchase flow can be tested; no real payment is taken.</Alert>}
        <div className="grid gap-5 lg:grid-cols-4">
          {plans.map((p) => {
            const featured = p.slug === "premium-annual";
            return (
              <article key={p.id} className={cn("card relative flex flex-col p-6", featured && "border-gold-400 shadow-glow")}>
                {featured && <span className="absolute -top-3 left-6 rounded-full bg-gold-400 px-3 py-0.5 text-xs font-bold text-navy">Best value</span>}
                <h2 className="text-lg font-bold">{p.name}</h2>
                <p className="mt-1 text-sm text-muted">{p.description}</p>
                <p className="mt-5 font-display text-3xl font-extrabold">{p.tier === "CORPORATE" ? "Custom" : p.priceCents === 0 ? "Free" : formatMoney(p.priceCents, p.currency)}{p.priceCents > 0 && <span className="text-sm font-normal text-muted"> / {p.interval === "MONTH" ? "month" : "year"}</span>}</p>
                <ul className="mt-5 flex-1 space-y-2 text-sm">{p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{f}</li>)}</ul>
                <div className="mt-6">
                  {p.tier === "FREE" ? <ButtonLink href={user ? "/dashboard" : "/register"} variant="secondary" className="w-full">{user ? "Go to dashboard" : "Start free"}</ButtonLink>
                    : p.tier === "CORPORATE" ? <ButtonLink href="/corporate#inquiry" variant="secondary" className="w-full">Contact sales</ButtonLink>
                    : <ButtonLink href={`/checkout?kind=plan&slug=${p.slug}`} variant={featured ? "gold" : "primary"} className="w-full">Choose {p.name}</ButtonLink>}
                </div>
              </article>
            );
          })}
        </div>
        <section>
          <h2 className="mb-4 text-xl font-bold">Compare plans</h2>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3 text-left">Feature</th><th className="px-4 py-3">Free</th><th className="px-4 py-3">Premium</th><th className="px-4 py-3">Corporate</th></tr></thead>
              <tbody className="divide-y divide-line">{COMPARE.map(([f, a, b, c]) => <tr key={f}><td className="px-4 py-3">{f}</td><td className="px-4 py-3 text-center">{cell(a)}</td><td className="px-4 py-3 text-center">{cell(b)}</td><td className="px-4 py-3 text-center">{cell(c)}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
        <section className="card flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
          <div><h2 className="text-lg font-bold">Focused learning bundles</h2><p className="text-sm text-muted">{packages} bundles for AML, sanctions, investigations, ABC or the complete academy — 12 months of access.</p></div>
          <ButtonLink href="/pricing/packages">View learning packages</ButtonLink>
        </section>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="card p-6"><h2 className="text-lg font-bold">Fee assistance</h2><p className="mt-1 text-sm text-muted">If cost is a barrier to your professional development, apply for a discount. Applications are reviewed individually.</p><div className="mt-4">{user ? <FeeAssistanceForm /> : <ButtonLink href="/login?next=/pricing" variant="secondary">Sign in to apply</ButtonLink>}</div></div>
          <div className="card p-6"><h2 className="text-lg font-bold">Billing questions</h2><ul className="mt-3 space-y-2 text-sm text-ink/85"><li>• Payments are processed securely by our payment provider; we never store card details.</li><li>• Invoices are available in Account settings → Billing.</li><li>• Cancel any time — access continues until the end of the paid period.</li></ul><Link href="/support/help/membership-billing" className="mt-4 inline-block text-sm font-semibold text-brand">Billing help →</Link></div>
        </section>
      </div>
    </>
  );
}
