import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { CheckoutError, loadProduct, paymentMode, quote } from "@/server/services/payments";
import { NotFoundError } from "@/server/services/courses";
import { CheckoutForm } from "@/components/billing/billing-forms";
import { Alert } from "@/components/ui/feedback";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ kind?: string; slug?: string }> }) {
  const { kind = "", slug = "" } = await searchParams;
  const user = await requireUser(`/checkout?kind=${kind}&slug=${slug}`);
  let product;
  try { product = await loadProduct(kind, slug); } catch (e) { if (e instanceof NotFoundError) notFound(); if (e instanceof CheckoutError) redirect("/pricing"); throw e; }
  const q = await quote(user.id, product);
  const mode = paymentMode();
  return (
    <div className="container max-w-2xl py-12">
      <p className="eyebrow">Secure checkout</p>
      <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
      <div className="card mt-6 p-6">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt>Price</dt><dd>{formatMoney(product.priceCents, product.currency)}{product.kind === "plan" && product.interval !== "ONE_TIME" ? ` / ${product.interval === "MONTH" ? "month" : "year"}` : ""}</dd></div>
          {q.assistancePct && <div className="flex justify-between text-success"><dt>Approved fee assistance ({q.assistancePct}%)</dt><dd>−{formatMoney(q.discountCents, product.currency)}</dd></div>}
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total due today</dt><dd>{formatMoney(q.totalCents, product.currency)}</dd></div>
        </dl>
        <p className="mt-2 text-xs text-muted">{product.kind === "package" ? `One-off payment for ${product.durationDays} days of access.` : "Renews automatically until cancelled."}</p>
        <div className="mt-6">
          {mode === "disabled" ? <Alert tone="warning">Online checkout is currently unavailable. Please contact support.</Alert> : <CheckoutForm kind={kind} slug={slug} />}
        </div>
        {mode === "development" && <Alert tone="warning" className="mt-4" title="Development mode">No payment provider is configured. You will be taken to a simulation page — no real payment will be taken.</Alert>}
        <p className="mt-4 flex items-center gap-2 text-xs text-muted"><ShieldCheck className="h-4 w-4" /> {mode === "stripe" ? "Payments are processed by Stripe. We never see or store your card details." : "Card details are never handled by FinCrime Academy servers."} <Lock className="h-3.5 w-3.5" /></p>
      </div>
    </div>
  );
}
