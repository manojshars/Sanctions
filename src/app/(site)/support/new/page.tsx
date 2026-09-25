import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { TICKET_CATEGORIES } from "@/server/services/support";
import { NewTicketForm } from "@/components/support/ticket-forms";

export const metadata: Metadata = { title: "Create a support ticket", robots: { index: false } };

export default async function NewTicketPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  await requireUser("/support/new");
  const { category } = await searchParams;
  return (
    <div className="container max-w-2xl py-10">
      <p className="eyebrow">Support Center</p>
      <h1 className="mt-1 text-3xl font-bold">Create a support ticket</h1>
      <p className="mt-1 text-muted">Please don&apos;t include passwords or sensitive personal data.</p>
      <div className="card mt-6 p-6"><NewTicketForm categories={TICKET_CATEGORIES} defaultCategory={category} /></div>
    </div>
  );
}
