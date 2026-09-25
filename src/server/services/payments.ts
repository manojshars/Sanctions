import Stripe from "stripe";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { notify, sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/utils";
import { AccessError, NotFoundError } from "./courses";

/**
 * Payments.
 *  - Stripe mode: STRIPE_SECRET_KEY set → Stripe Checkout; fulfilment happens in the signed webhook.
 *  - Development mode: no key and NODE_ENV !== "production" → a clearly labelled simulation page confirms the payment.
 *  - Production without Stripe keys → checkout is disabled (no fake payments in production).
 * Fulfilment is idempotent and entirely server-side; clients never set entitlements.
 */
export type PaymentMode = "stripe" | "development" | "disabled";

export function paymentMode(): PaymentMode {
  if (process.env.STRIPE_SECRET_KEY) return "stripe";
  if (process.env.NODE_ENV !== "production") return "development";
  return "disabled";
}

let stripeClient: Stripe | null = null;
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

export class CheckoutError extends Error {}

export type Product =
  | { kind: "plan"; id: string; name: string; priceCents: number; currency: string; interval: "MONTH" | "YEAR" | "ONE_TIME"; stripePriceId: string | null }
  | { kind: "package"; id: string; name: string; priceCents: number; currency: string; durationDays: number };

export async function loadProduct(kind: string, slug: string): Promise<Product> {
  if (kind === "plan") {
    const p = await db.membershipPlan.findUnique({ where: { slug } });
    if (!p || !p.isActive) throw new NotFoundError("Plan not found");
    if (p.tier === "FREE") throw new CheckoutError("The Free plan does not require checkout.");
    if (p.tier === "CORPORATE") throw new CheckoutError("Corporate plans are arranged with our team — use the corporate inquiry form.");
    return { kind: "plan", id: p.id, name: p.name, priceCents: p.priceCents, currency: p.currency, interval: p.interval, stripePriceId: p.stripePriceId };
  }
  if (kind === "package") {
    const p = await db.learningPackage.findUnique({ where: { slug } });
    if (!p || !p.isActive) throw new NotFoundError("Package not found");
    return { kind: "package", id: p.id, name: p.name, priceCents: p.priceCents, currency: p.currency, durationDays: p.durationDays };
  }
  throw new NotFoundError("Unknown product");
}

export async function validateCoupon(code: string | null | undefined, now = new Date()) {
  if (!code?.trim()) return null;
  const c = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!c || !c.isActive) throw new CheckoutError("This coupon code is not valid.");
  if (c.expiresAt && c.expiresAt < now) throw new CheckoutError("This coupon has expired.");
  if (c.maxRedemptions != null && c.redeemedCount >= c.maxRedemptions) throw new CheckoutError("This coupon has reached its redemption limit.");
  return c;
}

export function computeDiscount(priceCents: number, opts: { percentOff?: number | null; amountOffCents?: number | null; assistancePct?: number | null }) {
  let discount = 0;
  if (opts.percentOff) discount += Math.round((priceCents * Math.min(100, opts.percentOff)) / 100);
  if (opts.amountOffCents) discount += opts.amountOffCents;
  const afterCoupon = Math.max(0, priceCents - discount);
  if (opts.assistancePct) discount += Math.round((afterCoupon * Math.min(100, opts.assistancePct)) / 100);
  discount = Math.min(priceCents, discount);
  return { discountCents: discount, totalCents: priceCents - discount };
}

async function approvedAssistancePct(userId: string) {
  const r = await db.feeAssistanceRequest.findFirst({ where: { userId, status: "APPROVED" }, orderBy: { reviewedAt: "desc" } });
  return r?.discountPct ?? null;
}

export async function quote(userId: string, product: Product, couponCode?: string | null) {
  const coupon = await validateCoupon(couponCode);
  const assistancePct = await approvedAssistancePct(userId);
  const { discountCents, totalCents } = computeDiscount(product.priceCents, { percentOff: coupon?.percentOff, amountOffCents: coupon?.amountOffCents, assistancePct });
  return { coupon, assistancePct, discountCents, totalCents };
}

function invoiceNumber() {
  return `INV-${new Date().getUTCFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/** Creates a pending payment and returns where to send the user. */
export async function startCheckout(user: { id: string; email: string }, kind: string, slug: string, couponCode?: string | null) {
  const mode = paymentMode();
  if (mode === "disabled") throw new CheckoutError("Online checkout is not available right now. Please contact support.");
  const product = await loadProduct(kind, slug);
  const q = await quote(user.id, product, couponCode);
  const payment = await db.payment.create({
    data: {
      userId: user.id, amountCents: q.totalCents, discountCents: q.discountCents, currency: product.currency,
      provider: mode === "stripe" ? "stripe" : "development", invoiceNumber: invoiceNumber(), description: product.name,
      planId: product.kind === "plan" ? product.id : null, packageId: product.kind === "package" ? product.id : null, couponId: q.coupon?.id ?? null,
    },
  });
  if (q.totalCents === 0) {
    await fulfillPayment(payment.id, `free-${payment.id}`);
    return { url: `/settings/billing?success=1` };
  }
  if (mode === "development") return { url: `/checkout/dev/${payment.id}` };

  const recurring = product.kind === "plan" && product.interval !== "ONE_TIME";
  const session = await stripe().checkout.sessions.create({
    mode: recurring ? "subscription" : "payment",
    customer_email: user.email,
    client_reference_id: payment.id,
    metadata: { paymentId: payment.id },
    ...(recurring ? { subscription_data: { metadata: { paymentId: payment.id } } } : { payment_intent_data: { metadata: { paymentId: payment.id } } }),
    line_items: [
      recurring && product.kind === "plan" && product.stripePriceId && q.discountCents === 0
        ? { price: product.stripePriceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: product.currency.toLowerCase(),
              unit_amount: q.totalCents,
              product_data: { name: `FinCrime Academy — ${product.name}` },
              ...(recurring && product.kind === "plan" ? { recurring: { interval: product.interval === "YEAR" ? "year" : "month" } } : {}),
            },
          },
    ],
    success_url: appUrl(`/settings/billing?success=1`),
    cancel_url: appUrl(`/pricing?canceled=1`),
  });
  await db.payment.update({ where: { id: payment.id }, data: { providerRef: session.id } });
  return { url: session.url! };
}

/** Idempotent fulfilment: marks the payment succeeded and grants the membership exactly once. */
export async function fulfillPayment(paymentId: string, providerRef?: string, subscriptionRef?: string) {
  return db.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId }, include: { plan: true, package: true } });
    if (!p) throw new NotFoundError("Payment not found");
    if (p.status === "SUCCEEDED") return p;
    const now = new Date();
    const updated = await tx.payment.update({ where: { id: p.id }, data: { status: "SUCCEEDED", paidAt: now, ...(providerRef && !p.providerRef ? { providerRef } : {}) } });
    let endsAt: Date | null = null;
    if (p.plan) endsAt = p.plan.interval === "MONTH" ? new Date(now.getTime() + 31 * 86400_000) : p.plan.interval === "YEAR" ? new Date(now.getTime() + 366 * 86400_000) : null;
    if (p.package) endsAt = new Date(now.getTime() + p.package.durationDays * 86400_000);
    await tx.membership.create({ data: { userId: p.userId, planId: p.planId, packageId: p.packageId, source: "PURCHASE", endsAt, providerRef: subscriptionRef ?? providerRef ?? null } });
    if (p.couponId) await tx.coupon.update({ where: { id: p.couponId }, data: { redeemedCount: { increment: 1 } } });
    return updated;
  }).then(async (p) => {
    const user = await db.user.findUnique({ where: { id: p.userId } });
    await notify(p.userId, "Payment confirmed", `Your ${p.description} access is now active.`, "/settings/billing");
    if (user) await sendEmail(user.email, "FinCrime Academy — payment confirmed", `Thank you. Your ${p.description} access is active. Invoice ${p.invoiceNumber}.`);
    return p;
  });
}

export async function confirmDevPayment(userId: string, paymentId: string) {
  if (paymentMode() !== "development") throw new AccessError("Development payments are disabled.");
  const p = await db.payment.findUnique({ where: { id: paymentId } });
  if (!p || p.userId !== userId) throw new NotFoundError("Payment not found");
  return fulfillPayment(paymentId, `dev-${paymentId}`);
}

export async function cancelMembership(userId: string, membershipId: string) {
  const m = await db.membership.findUnique({ where: { id: membershipId } });
  if (!m || m.userId !== userId) throw new NotFoundError("Membership not found");
  if (m.providerRef?.startsWith("sub_") && paymentMode() === "stripe") {
    await stripe().subscriptions.update(m.providerRef, { cancel_at_period_end: true });
  }
  return db.membership.update({ where: { id: m.id }, data: { cancelAtPeriodEnd: true } });
}

/** Handles verified Stripe webhook events. */
export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const paymentId = s.metadata?.paymentId ?? s.client_reference_id;
      if (paymentId && s.payment_status === "paid") await fulfillPayment(paymentId, s.id, typeof s.subscription === "string" ? s.subscription : undefined);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await db.membership.updateMany({ where: { providerRef: sub.id }, data: { status: "CANCELED", endsAt: new Date() } });
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice & { subscription?: string | null };
      if (typeof inv.subscription === "string") await db.membership.updateMany({ where: { providerRef: inv.subscription }, data: { status: "PAST_DUE" } });
      break;
    }
  }
}
