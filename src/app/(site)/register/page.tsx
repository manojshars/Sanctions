import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthAside, AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Create your account", description: "Start learning financial crime compliance for free." };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect("/dashboard");
  const topics = await db.topic.findMany({ orderBy: { order: "asc" }, select: { slug: true, name: true } });
  return (
    <AuthShell title="Create your free account" description="Free access to foundational courses, practice questions and flashcards." aside={<AuthAside />}>
      <RegisterForm topics={topics} next={sp.next} />
    </AuthShell>
  );
}
