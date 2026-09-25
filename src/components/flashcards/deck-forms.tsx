"use client";
import { createCardAction, createDeckAction } from "@/server/actions/flashcards";
import { useFormAction } from "@/components/forms/use-action";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { useRef } from "react";

export function CreateDeckForm() {
  const [state, action] = useFormAction(createDeckAction);
  return (
    <form action={action} className="space-y-3">
      <div><label className="label" htmlFor="deck-title">Deck title</label><Input id="deck-title" name="title" required maxLength={80} placeholder="e.g. My OFAC revision" /></div>
      <div><label className="label" htmlFor="deck-desc">Description (optional)</label><Input id="deck-desc" name="description" maxLength={300} /></div>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <SubmitButton pendingText="Creating…">Create deck</SubmitButton>
    </form>
  );
}

export function CreateCardForm({ deckId }: { deckId: string }) {
  const [state, action] = useFormAction(createCardAction);
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={async (f) => { await action(f); ref.current?.reset(); }} className="space-y-3">
      <input type="hidden" name="deckId" value={deckId} />
      <div><label className="label" htmlFor="c-front">Front (question or term)</label><Textarea id="c-front" name="front" required maxLength={500} className="min-h-[70px]" /></div>
      <div><label className="label" htmlFor="c-back">Back (answer)</label><Textarea id="c-back" name="back" required maxLength={2000} className="min-h-[70px]" /></div>
      <div><label className="label" htmlFor="c-exp">Explanation (optional)</label><Input id="c-exp" name="explanation" maxLength={2000} /></div>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}
      <SubmitButton pendingText="Adding…">Add card</SubmitButton>
    </form>
  );
}
