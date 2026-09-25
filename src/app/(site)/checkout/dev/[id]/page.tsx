import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { paymentMode } from "@/server/services/payments";
import { DevConfirm } from "@/components/billing/billing-forms";
import { ButtonLink } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Development payment", robots: { index: false } };

export default async function DevCheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (paymentMode() !== "development") notFound();
  const p = await db.payment.findUnique({ where: { id } });
  if (!p || p.userId !== user.id) notFound();
  return (
    <div className="container max-w-xl py-16">
      <div className="card border-warning/50 p-8">
        <FlaskConical className="h-9 w-9 text-warning" />
        <h1 className="mt-4 text-2xl font-bold">Development payment simulation</h1>
        <p className="mt-2 text-sm text-muted">This environment has no payment provider configured. Confirming below simulates a successful payment so the membership flow can be tested end-to-end. <strong>No money is charged.</strong> This page is unavailable in production.</p>
        <dl className="mt-6 space-y-1 text-sm"><div className="flex justify-between"><dt>Item</dt><dd>{p.description}</dd></div><div className="flex justify-between"><dt>Amount</dt><dd>{formatMoney(p.amountCents, p.currency)}</dd></div><div className="flex justify-between"><dt>Invoice</dt><dd>{p.invoiceNumber}</dd></div><div className="flex justify-between"><dt>Status</dt><dd>{p.status}</dd></div></dl>
        <div className="mt-6 flex gap-3">{p.status === "PENDING" ? <DevConfirm paymentId={p.id} /> : <ButtonLink href="/settings/billing">View billing</ButtonLink>}<ButtonLink href="/pricing" variant="ghost">Cancel</ButtonLink></div>
      </div>
    </div>
  );
}
