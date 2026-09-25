import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Flash, L, SubmitBar, ActionButton } from "@/components/admin/ui";
import { Input, Select, Textarea } from "@/components/ui/form";
import { deleteCardAction, saveCardAction, saveDeckAction } from "@/server/actions/admin";

export const metadata = { title: "Deck" };

export default async function AdminDeck({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requirePermission("content:manage");
  const { id } = await params;
  const sp = await searchParams;
  const [deck, topics] = await Promise.all([db.flashcardDeck.findUnique({ where: { id }, include: { cards: { orderBy: { order: "asc" } } } }), db.topic.findMany({ orderBy: { order: "asc" } })]);
  if (!deck || deck.ownerId) notFound();
  return (
    <>
      <AdminHeader title={deck.title} back={{ href: "/admin/flashcards", label: "Flashcards" }} description={`${deck.cards.length} cards`} />
      <Flash sp={sp} />
      <form action={saveDeckAction.bind(null, deck.id)} className="card mb-6 grid gap-4 p-5 md:grid-cols-5">
        <L label="Title" htmlFor="title"><Input id="title" name="title" defaultValue={deck.title} required /></L>
        <div className="md:col-span-2"><L label="Description" htmlFor="description"><Input id="description" name="description" defaultValue={deck.description} required /></L></div>
        <L label="Topic" htmlFor="topicId"><Select id="topicId" name="topicId" defaultValue={deck.topicId ?? ""}>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></L>
        <div className="grid grid-cols-2 gap-2"><L label="Access" htmlFor="accessTier"><Select id="accessTier" name="accessTier" defaultValue={deck.accessTier}><option>FREE</option><option>PREMIUM</option></Select></L><L label="Status" htmlFor="status"><Select id="status" name="status" defaultValue={deck.status}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></Select></L></div>
        <div className="md:col-span-5"><SubmitBar label="Save deck" /></div>
      </form>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          {deck.cards.map((c) => (
            <details key={c.id} className="card p-4">
              <summary className="cursor-pointer font-medium">{c.front} <span className="text-xs text-muted">({c.status.toLowerCase()})</span></summary>
              <form action={saveCardAction.bind(null, deck.id, c.id)} className="mt-3 space-y-3">
                <Textarea name="front" defaultValue={c.front} aria-label="Front" className="min-h-[60px]" required />
                <Textarea name="back" defaultValue={c.back} aria-label="Back" className="min-h-[60px]" required />
                <Input name="explanation" defaultValue={c.explanation ?? ""} aria-label="Explanation" placeholder="Explanation" />
                <div className="flex gap-2"><Select name="difficulty" defaultValue={c.difficulty} aria-label="Difficulty"><option>BEGINNER</option><option>INTERMEDIATE</option><option>ADVANCED</option></Select><Select name="status" defaultValue={c.status} aria-label="Status"><option>PUBLISHED</option><option>DRAFT</option><option>ARCHIVED</option></Select></div>
                <SubmitBar label="Save card" />
              </form>
              <div className="mt-2"><ActionButton action={deleteCardAction.bind(null, deck.id, c.id)} label="Delete card" tone="danger" /></div>
            </details>
          ))}
        </div>
        <form action={saveCardAction.bind(null, deck.id, null)} className="card space-y-3 self-start p-5">
          <h2 className="font-semibold">Add card</h2>
          <L label="Front" htmlFor="nf"><Textarea id="nf" name="front" required className="min-h-[60px]" /></L>
          <L label="Back" htmlFor="nb"><Textarea id="nb" name="back" required className="min-h-[60px]" /></L>
          <L label="Explanation" htmlFor="ne"><Input id="ne" name="explanation" /></L>
          <input type="hidden" name="difficulty" value="BEGINNER" /><input type="hidden" name="status" value="PUBLISHED" />
          <SubmitBar label="Add card" />
        </form>
      </div>
    </>
  );
}
