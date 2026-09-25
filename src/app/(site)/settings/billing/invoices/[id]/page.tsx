import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { LogoMark } from "@/components/layout/logo";
import { PrintButton } from "@/components/common/print-button";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const p = await db.payment.findUnique({ where: { id }, include: { user: true, coupon: true } });
  if (!p || p.userId !== user.id || p.status !== "SUCCEEDED") notFound();
  return (
    <div className="container max-w-3xl py-10">
      <div className="card p-8 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between"><div className="flex items-center gap-3"><LogoMark /><div><p className="font-display font-extrabold tracking-wide">FINCRIME ACADEMY</p><p className="text-xs text-muted">Receipt / invoice</p></div></div><div className="text-right text-sm"><p className="font-semibold">{p.invoiceNumber}</p><p className="text-muted">{formatDate(p.paidAt ?? p.createdAt)}</p></div></div>
        <div className="mt-8 text-sm"><p className="text-muted">Billed to</p><p className="font-semibold">{p.user.name}</p><p>{p.user.email}</p></div>
        <table className="mt-8 w-full text-sm"><thead className="border-b border-line text-left text-xs uppercase text-muted"><tr><th className="py-2">Description</th><th className="text-right">Amount</th></tr></thead>
          <tbody><tr><td className="py-3">{p.description}</td><td className="text-right">{formatMoney(p.amountCents + p.discountCents, p.currency)}</td></tr>
            {p.discountCents > 0 && <tr><td className="py-1 text-muted">Discount{p.coupon ? ` (${p.coupon.code})` : ""}</td><td className="text-right text-muted">−{formatMoney(p.discountCents, p.currency)}</td></tr>}
            <tr className="border-t border-line font-bold"><td className="py-3">Total paid</td><td className="text-right">{formatMoney(p.amountCents, p.currency)}</td></tr></tbody></table>
        <p className="mt-6 text-xs text-muted">Payment processed by {p.provider === "development" ? "development simulation (no charge)" : p.provider}. Reference: {p.providerRef ?? "—"}. Tax details are provided by the payment provider where applicable.</p>
      </div>
      <div className="mt-4 print:hidden"><PrintButton /></div>
    </div>
  );
}
