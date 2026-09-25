"use server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { currentIp, getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import type { ActionState } from "@/server/action-types";
import { sendEmail } from "@/lib/email";
import { NEWSLETTER_CONSENT } from "@/lib/consent";


export async function subscribeNewsletterAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const ip = (await currentIp()) ?? "unknown";
  if (!rateLimit(`newsletter:${ip}`, 10, 60 * 60_000).ok) return { error: "Too many requests. Try again later." };
  const email = z.string().trim().toLowerCase().email().safeParse(form.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };
  if (form.get("consent") !== "on") return { error: "Please confirm your consent to receive the newsletter." };
  await db.newsletterSubscriber.upsert({
    where: { email: email.data },
    update: { unsubscribedAt: null, consentAt: new Date(), consentText: NEWSLETTER_CONSENT },
    create: { email: email.data, consentText: NEWSLETTER_CONSENT, token: randomBytes(18).toString("base64url") },
  });
  return { ok: true, message: "Thank you — you're subscribed. You can unsubscribe at any time." };
}

export async function unsubscribeNewsletter(token: string): Promise<boolean> {
  const res = await db.newsletterSubscriber.updateMany({ where: { token, unsubscribedAt: null }, data: { unsubscribedAt: new Date() } });
  return res.count > 0;
}

const inquirySchema = z.object({
  type: z.enum(["CORPORATE", "WORKSHOP", "CONTACT"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  company: z.string().trim().max(160).optional(),
  teamSize: z.string().trim().max(40).optional(),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().min(10, "Please add a little more detail (10+ characters).").max(5000),
});

export async function submitInquiryAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const ip = (await currentIp()) ?? "unknown";
  if (!rateLimit(`inquiry:${ip}`, 6, 60 * 60_000).ok) return { error: "Too many submissions. Please try again later." };
  const parsed = inquirySchema.safeParse(Object.fromEntries([...form.entries()].map(([k, v]) => [k, v === "" ? undefined : v])));
  if (!parsed.success) return { error: "Please complete the required fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  const user = await getCurrentUser();
  let orgId: string | undefined;
  if (user && parsed.data.type === "WORKSHOP") {
    const m = await db.organizationMember.findFirst({ where: { userId: user.id, role: "MANAGER" } });
    orgId = m?.orgId;
  }
  await db.inquiry.create({ data: { ...parsed.data, orgId } });
  await sendEmail(parsed.data.email, "We received your message", `Hello ${parsed.data.name},\n\nThank you for contacting FinCrime Academy. Our team will reply by email.\n\n— FinCrime Academy`);
  return { ok: true, message: "Thank you. Your message has been received and our team will respond by email." };
}
