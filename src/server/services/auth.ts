import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, passwordIssues, verifyPassword } from "@/lib/auth/password";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/utils";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
  password: z.string().superRefine((p, ctx) => passwordIssues(p).forEach((m) => ctx.addIssue({ code: "custom", message: m }))),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  interests: z.array(z.string().max(60)).max(15).default([]),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms and Privacy Policy." }) }),
  marketingOptIn: z.boolean().default(false),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export class AuthError extends Error {}

export async function registerUser(input: RegisterInput) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AuthError("An account with this email already exists.");
  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      level: input.level,
      interests: input.interests,
      marketingOptIn: input.marketingOptIn,
    },
  });
  await issueEmailVerification(user.email);
  await db.notification.create({
    data: { userId: user.id, title: "Welcome to FinCrime Academy", body: "Set your learning interests and start your first course or practice session.", link: "/dashboard" },
  });
  return user;
}

/** Constant-time-ish authentication: always runs a bcrypt compare to limit user enumeration via timing. */
export async function authenticate(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  const ok = await verifyPassword(password, user?.passwordHash ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
  if (!user || !ok || user.status !== "ACTIVE") return null;
  return user;
}

export async function issueEmailVerification(email: string) {
  const token = generateToken();
  await db.verificationToken.create({
    data: { email, tokenHash: hashToken(token), purpose: "EMAIL_VERIFY", expiresAt: new Date(Date.now() + 48 * 3600_000) },
  });
  await sendEmail(email, "Verify your FinCrime Academy email", `Confirm your email address:\n\n${appUrl(`/verify-email?token=${token}`)}\n\nThis link expires in 48 hours.`);
}

export async function consumeToken(token: string, purpose: "EMAIL_VERIFY" | "PASSWORD_RESET") {
  const rec = await db.verificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!rec || rec.purpose !== purpose || rec.usedAt || rec.expiresAt < new Date()) return null;
  await db.verificationToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } });
  return rec;
}

export async function verifyEmailToken(token: string) {
  const rec = await consumeToken(token, "EMAIL_VERIFY");
  if (!rec) return false;
  await db.user.updateMany({ where: { email: rec.email }, data: { emailVerifiedAt: new Date() } });
  return true;
}

export async function requestPasswordReset(email: string) {
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || user.status !== "ACTIVE") return; // do not reveal whether the account exists
  const token = generateToken();
  await db.verificationToken.create({
    data: { email: user.email, tokenHash: hashToken(token), purpose: "PASSWORD_RESET", expiresAt: new Date(Date.now() + 3600_000) },
  });
  await sendEmail(user.email, "Reset your FinCrime Academy password", `Reset your password:\n\n${appUrl(`/reset-password?token=${token}`)}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`);
}

export async function resetPassword(token: string, password: string) {
  const issues = passwordIssues(password);
  if (issues.length) throw new AuthError(issues[0]);
  const rec = await consumeToken(token, "PASSWORD_RESET");
  if (!rec) throw new AuthError("This reset link is invalid or has expired.");
  const user = await db.user.update({ where: { email: rec.email }, data: { passwordHash: await hashPassword(password) } });
  await db.session.deleteMany({ where: { userId: user.id } }); // sign out everywhere
  return user;
}
