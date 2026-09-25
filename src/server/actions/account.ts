"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireActionUser, SESSION_COOKIE } from "@/lib/auth/session";
import { AccountError, changePassword, deleteAccount, profileSchema, updateProfile } from "@/server/services/account";
import { issueEmailVerification } from "@/server/services/auth";
import { rateLimit } from "@/lib/rate-limit";
import type { ActionState } from "@/server/action-types";

export async function updateProfileAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireActionUser();
  const parsed = profileSchema.safeParse({
    name: form.get("name"), headline: form.get("headline") ?? "", level: form.get("level"),
    interests: form.getAll("interests").map(String), marketingOptIn: form.get("marketingOptIn") === "on",
  });
  if (!parsed.success) return { error: "Please check your details.", fieldErrors: parsed.error.flatten().fieldErrors };
  await updateProfile(user.id, parsed.data);
  revalidatePath("/profile");
  return { ok: true, message: "Profile updated." };
}

export async function changePasswordAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireActionUser();
  if (!rateLimit(`pw:${user.id}`, 5, 15 * 60_000).ok) return { error: "Too many attempts. Try again later." };
  if (form.get("next") !== form.get("confirm")) return { error: "New passwords do not match." };
  try {
    await changePassword(user.id, String(form.get("current") ?? ""), String(form.get("next") ?? ""));
  } catch (e) {
    if (e instanceof AccountError) return { error: e.message };
    throw e;
  }
  return { ok: true, message: "Password changed." };
}

export async function resendVerificationAction(): Promise<ActionState> {
  const user = await requireActionUser();
  if (!rateLimit(`verify-mail:${user.id}`, 3, 60 * 60_000).ok) return { error: "Please wait before requesting another email." };
  await issueEmailVerification(user.email);
  return { ok: true, message: "Verification email sent." };
}

export async function deleteAccountAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireActionUser();
  if (form.get("confirm") !== "DELETE") return { error: 'Type DELETE to confirm.' };
  try {
    await deleteAccount(user.id, String(form.get("password") ?? ""));
  } catch (e) {
    if (e instanceof AccountError) return { error: e.message };
    throw e;
  }
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/?deleted=1");
}
