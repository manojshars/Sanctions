"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function FlipCard({ front, back, explanation, topic, className, flipped: controlled, onFlip, size = "md" }: {
  front: string; back: string; explanation?: string | null; topic?: string; className?: string;
  flipped?: boolean; onFlip?: (v: boolean) => void; size?: "md" | "lg";
}) {
  const [internal, setInternal] = useState(false);
  const flipped = controlled ?? internal;
  const toggle = () => { const v = !flipped; if (onFlip) onFlip(v); else setInternal(v); };
  const h = size === "lg" ? "min-h-[320px] sm:min-h-[360px]" : "min-h-[240px]";
  return (
    <div className={cn("flip-scene", className)}>
      <button type="button" onClick={toggle} aria-label={flipped ? "Show question" : "Reveal answer"} aria-pressed={flipped}
        className={cn("flip-card relative block w-full text-left", h, flipped && "is-flipped")}>
        <div className={cn("flip-face absolute inset-0 flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8")} aria-hidden={flipped}>
          {topic && <span className="eyebrow">{topic}</span>}
          <p className="my-auto py-6 font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">{front}</p>
          <span className="flex items-center gap-1.5 text-xs text-muted"><RotateCcw className="h-3.5 w-3.5" aria-hidden /> Tap or press Enter to reveal</span>
        </div>
        <div className={cn("flip-face flip-back absolute inset-0 flex flex-col overflow-auto rounded-2xl border border-gold-400/50 bg-navy p-6 text-white shadow-glow sm:p-8")} aria-hidden={!flipped}>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-300">Answer</span>
          <p className="mt-4 text-lg leading-relaxed">{back}</p>
          {explanation && <p className="mt-4 border-t border-white/10 pt-4 text-sm text-white/70">{explanation}</p>}
        </div>
      </button>
    </div>
  );
}
