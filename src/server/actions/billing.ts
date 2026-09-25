"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, requireActionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AccessError, NotFoundError } from "@/server/services/courses";
import { CheckoutError, cancelMembership, confirmDevPayment, loadProduct, quote, startCheckout } from "@/server/services/payments";
import type { ActionState } from "@/server/action-types";
import { formatMoney } from "@/lib/utils";

function fail(e: unknown): ActionState {
  if (e instanceof CheckoutError || e instanceof NotFoundError || e instanceof AccessError) return { error: e.message };
  throw e;
}

export async function checkoutAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const kind = String(form.get("kind"));
  const slug = String(form.get("slug"));
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkout?kind=${kind}&slug=${slug}`)}`);
  let url: string;
  try {
    url = (await startCheckout(user, kind, slug, (form.get("coupon") as string) || null)).url;
  } catch (e) {
    return fail(e);
  }
  redirect(url);
}

export async function previewCouponAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireActionUser();
  try {
    const product = await loadProduct(String(form.get("kind")), String(form.get("slug")));
    const q = await quote(user.id, product, (form.get("coupon") as string) || null);
    return { ok: true, message: `New total: ${formatMoney(q.totalCents, product.currency)} (you save ${formatMoney(q.discountCents, product.currency)}).` };
  } catch (e) {
    return fail(e);
  }
}

export async function confirmDevPaymentAction(paymentId: string): Promise<ActionState> {
  const user = await requireActionUser();
  try {
    await confirmDevPayment(user.id, paymentId);
  } catch (e) {
    return fail(e);
  }
  redirect("/settings/billing?success=1");
}

export async function cancelMembershipAction(membershipId: string): Promise<ActionState> {
  const user = await requireActionUser();
  try {
    await cancelMembership(user.id, membershipId);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/settings/billing");
  return { ok: true, message: "Your membership will not renew. Access continues until the end of the current period." };
}

const assistanceSchema = z.object({ reason: z.string().trim().min(30, "Please tell us a little more (30+ characters).").max(3000), country: z.string().trim().max(80).optional() });

export async function feeAssistanceAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/pricing");
  const setting = await db.setting.findUnique({ where: { key: "feeAssistance" } });
  if (!(setting?.value as { enabled?: boolean } | null)?.enabled) return { error: "Fee assistance applications are currently closed." };
  const parsed = assistanceSchema.safeParse({ reason: form.get("reason"), country: form.get("country") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const open = await db.feeAssistanceRequest.findFirst({ where: { userId: user.id, status: { in: ["NEW", "IN_PROGRESS"] } } });
  if (open) return { error: "You already have an application under review." };
  await db.feeAssistanceRequest.create({ data: { userId: user.id, ...parsed.data } });
  return { ok: true, message: "Thank you. Your application has been received and will be reviewed by our team." };
}
