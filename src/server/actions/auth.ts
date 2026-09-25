"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, currentIp, destroySession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { AuthError, authenticate, registerSchema, registerUser, requestPasswordReset, resetPassword } from "@/server/services/auth";
import type { ActionState } from "@/server/action-types";
import { redirectOrReturn } from "@/server/action-redirect";
import { audit } from "@/lib/audit";

function safeNext(next: FormDataEntryValue | null): string {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

export async function loginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const ip = (await currentIp()) ?? "unknown";
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!rateLimit(`login:${ip}`, 20, 15 * 60_000).ok || !rateLimit(`login:${email}`, 8, 15 * 60_000).ok) {
    return { error: "Too many sign-in attempts. Please wait a few minutes and try again." };
  }
  if (!email || !password) return { error: "Enter your email and password." };
  const user = await authenticate(email, password);
  if (!user) return { error: "Incorrect email or password." };
  await createSession(user.id);
  if (user.role !== "LEARNER") await audit(user.id, "auth.login", "User", user.id, undefined, ip);
  return redirectOrReturn(safeNext(form.get("next")));
}

export async function registerAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const ip = (await currentIp()) ?? "unknown";
  if (!rateLimit(`register:${ip}`, 10, 60 * 60_000).ok) return { error: "Too many registrations from this network. Try again later." };
  const parsed = registerSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
    level: form.get("level") || "BEGINNER",
    interests: form.getAll("interests").map(String),
    acceptTerms: form.get("acceptTerms") === "on",
    marketingOptIn: form.get("marketingOptIn") === "on",
  });
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const user = await registerUser(parsed.data);
    await createSession(user.id);
  } catch (e) {
    if (e instanceof AuthError) return { error: e.message, fieldErrors: { email: [e.message] } };
    throw e;
  }
  return redirectOrReturn(safeNext(form.get("next")) === "/dashboard" ? "/dashboard?welcome=1" : safeNext(form.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const ip = (await currentIp()) ?? "unknown";
  if (!rateLimit(`forgot:${ip}`, 5, 15 * 60_000).ok) return { error: "Too many requests. Try again later." };
  const email = z.string().email().safeParse(String(form.get("email") ?? "").trim());
  if (!email.success) return { fieldErrors: { email: ["Enter a valid email address."] } };
  await requestPasswordReset(email.data);
  return { ok: true, message: "If an account exists for that email, a reset link has been sent." };
}

export async function resetPasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  if (password !== String(form.get("confirm") ?? "")) return { fieldErrors: { confirm: ["Passwords do not match."] } };
  try {
    await resetPassword(token, password);
  } catch (e) {
    if (e instanceof AuthError) return { error: e.message };
    throw e;
  }
  return redirectOrReturn("/login?reset=1");
}
