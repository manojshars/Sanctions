import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getTicket } from "@/server/services/support";
import { NotFoundError } from "@/server/services/courses";
import { TicketThread } from "@/components/support/thread";
import { ReplyForm, CloseTicketButton } from "@/components/support/ticket-forms";
import { StatusBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Support ticket", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TicketPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ created?: string }> }) {
  const n = Number((await params).number);
  const sp = await searchParams;
  const user = await requireUser(`/support/tickets/${n}`);
  if (!Number.isInteger(n)) notFound();
  let t;
  try { t = await getTicket({ ...user, role: "LEARNER" }, n); } catch (e) { if (e instanceof NotFoundError) notFound(); throw e; }
  const history = [
    { label: "Created", at: t.createdAt }, t.firstResponseAt && { label: "First response", at: t.firstResponseAt }, t.resolvedAt && { label: "Resolved", at: t.resolvedAt }, t.closedAt && { label: "Closed", at: t.closedAt },
  ].filter(Boolean) as { label: string; at: Date }[];
  return (
    <div className="container max-w-4xl py-10">
      <Link href="/support/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> My tickets</Link>
      {sp.created && <Alert tone="success" className="mt-4">Your ticket has been created. We&apos;ll notify you when our team replies.</Alert>}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-sm text-muted">Ticket #{t.number} · {t.category}</p><h1 className="text-2xl font-bold">{t.subject}</h1></div>
        <div className="flex items-center gap-2"><StatusBadge status={t.status} />{t.status !== "CLOSED" && <CloseTicketButton number={t.number} />}</div>
      </div>
      <ol className="mt-4 flex flex-wrap gap-4 text-xs text-muted">{history.map((h) => <li key={h.label}>{h.label}: {formatDate(h.at)}</li>)}</ol>
      <div className="mt-6"><TicketThread messages={t.messages} requesterId={t.userId} /></div>
      {t.status !== "CLOSED" ? <div className="card mt-6 p-5"><ReplyForm number={t.number} /></div> : <p className="mt-6 text-sm text-muted">This ticket is closed. <Link href="/support/new" className="text-brand underline">Open a new ticket</Link> if you need more help.</p>}
    </div>
  );
}
