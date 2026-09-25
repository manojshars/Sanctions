import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My tickets", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const user = await requireUser("/support/tickets");
  const tickets = await db.supportTicket.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-bold">My tickets</h1><ButtonLink href="/support/new">New ticket</ButtonLink></div>
      {tickets.length ? (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3">Ticket</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Updated</th></tr></thead>
            <tbody className="divide-y divide-line">{tickets.map((t) => <tr key={t.id}><td className="px-4 py-3"><Link href={`/support/tickets/${t.number}`} className="font-medium hover:text-brand">#{t.number} {t.subject}</Link></td><td className="px-4 py-3 text-muted">{t.category}</td><td className="px-4 py-3"><StatusBadge status={t.status} /></td><td className="px-4 py-3 text-muted">{formatDate(t.updatedAt)}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <EmptyState className="mt-6" icon={Inbox} title="No tickets yet" action={<ButtonLink href="/support/new">Create a ticket</ButtonLink>} />}
    </div>
  );
}
