import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Flash, Table, Td, L, SubmitBar } from "@/components/admin/ui";
import { StatusBadge, TierBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/form";
import { saveDeckAction } from "@/server/actions/admin";

export const metadata = { title: "Flashcards" };

export default async function AdminFlashcards({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requirePermission("content:manage");
  const sp = await searchParams;
  const [decks, topics, personal] = await Promise.all([
    db.flashcardDeck.findMany({ where: { ownerId: null }, include: { topic: true, _count: { select: { cards: true } } }, orderBy: { title: "asc" } }),
    db.topic.findMany({ orderBy: { order: "asc" } }),
    db.flashcardDeck.count({ where: { ownerId: { not: null } } }),
  ]);
  return (
    <>
      <AdminHeader title="Flashcard management" description={`${decks.length} official decks · ${decks.reduce((s, d) => s + d._count.cards, 0)} cards · ${personal} learner personal decks (private)`} />
      <Flash sp={sp} />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Table head={["Deck", "Topic", "Cards", "Access", "Status"]}>{decks.map((d) => <tr key={d.id}><Td><Link href={`/admin/flashcards/${d.id}`} className="text-brand hover:underline">{d.title}</Link></Td><Td>{d.topic?.shortName ?? "—"}</Td><Td>{d._count.cards}</Td><Td><TierBadge tier={d.accessTier} /></Td><Td><StatusBadge status={d.status} /></Td></tr>)}</Table>
        <form action={saveDeckAction.bind(null, null)} className="card space-y-4 self-start p-5">
          <h2 className="font-semibold">New deck</h2>
          <L label="Title" htmlFor="title"><Input id="title" name="title" required /></L>
          <L label="Description" htmlFor="description"><Input id="description" name="description" required /></L>
          <L label="Topic" htmlFor="topicId"><Select id="topicId" name="topicId">{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></L>
          <div className="grid grid-cols-2 gap-3"><L label="Access" htmlFor="accessTier"><Select id="accessTier" name="accessTier"><option>FREE</option><option>PREMIUM</option></Select></L><L label="Status" htmlFor="status"><Select id="status" name="status" defaultValue="DRAFT"><option>DRAFT</option><option>PUBLISHED</option></Select></L></div>
          <SubmitBar label="Create deck" />
        </form>
      </div>
    </>
  );
}
