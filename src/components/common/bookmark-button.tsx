"use client";
import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, Flag } from "lucide-react";
import { toggleBookmarkAction } from "@/server/actions/bookmarks";
import { cn } from "@/lib/utils";

export function BookmarkButton({ entityType, entityId, initial, label = "Save", savedLabel, kind = "SAVE", className }: {
  entityType: string; entityId: string; initial: boolean; label?: string; savedLabel?: string; kind?: "SAVE" | "FLAG"; className?: string;
}) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const [err, setErr] = useState(false);
  const Icon = kind === "FLAG" ? Flag : saved ? BookmarkCheck : Bookmark;
  return (
    <button type="button" disabled={pending} aria-pressed={saved}
      onClick={() => start(async () => {
        setErr(false);
        try { const r = await toggleBookmarkAction(entityType, entityId, kind); setSaved(r.saved); } catch { setErr(true); }
      })}
      className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60",
        saved ? "border-gold-400/50 bg-gold-400/10 text-accent" : "border-line bg-surface text-muted hover:text-ink", className)}>
      <Icon className={cn("h-4 w-4", saved && kind === "FLAG" && "fill-current")} aria-hidden />
      {saved ? savedLabel ?? (kind === "FLAG" ? "Flagged" : "Saved") : label}
      {err && <span className="sr-only">Could not update</span>}
    </button>
  );
}
