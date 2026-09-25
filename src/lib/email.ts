import { db } from "@/lib/db";

/**
 * Transactional email. Provider is selected by EMAIL_PROVIDER:
 *  - "log" (default): message is recorded in the EmailLog table only (development / no provider configured).
 *  - "resend": sent via the Resend HTTP API using RESEND_API_KEY.
 * Every message is logged with its delivery status.
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<{ delivered: boolean }> {
  const provider = process.env.EMAIL_PROVIDER || "log";
  if (provider === "resend" && process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text: body }),
      });
      const ok = res.ok;
      await db.emailLog.create({
        data: { to, subject, body, provider, status: ok ? "SENT" : "FAILED", error: ok ? null : await res.text() },
      });
      return { delivered: ok };
    } catch (e) {
      await db.emailLog.create({ data: { to, subject, body, provider, status: "FAILED", error: String(e) } });
      return { delivered: false };
    }
  }
  await db.emailLog.create({ data: { to, subject, body, provider: "log", status: "LOGGED" } });
  return { delivered: false };
}

export async function notify(userId: string, title: string, body: string, link?: string) {
  await db.notification.create({ data: { userId, title, body, link } });
}
