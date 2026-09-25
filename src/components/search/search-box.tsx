"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Search, X } from "lucide-react";

const KEY = "fca-recent-searches";
type Item = { title: string; href: string; type: string };

export function SearchBox({ initial = "", topic, type }: { initial?: string; topic?: string; type?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [items, setItems] = useState<Item[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch {}
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setItems([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((j) => setItems(j.items ?? []))
        .catch(() => {});
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(term: string) {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recent.filter((r) => r !== t)].slice(0, 6);
    setRecent(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    setOpen(false);
    const p = new URLSearchParams({ q: t });
    if (topic) p.set("topic", topic);
    if (type) p.set("type", type);
    router.push(`/search?${p}`);
  }

  const showRecent = open && q.trim().length < 2 && recent.length > 0;
  const list: Item[] = showRecent ? recent.map((r) => ({ title: r, href: "", type: "Recent" })) : items;

  function choose(it: Item) {
    if (it.href) router.push(it.href);
    else go(it.title);
  }

  return (
    <div ref={boxRef} className="relative">
      <form role="search" onSubmit={(e) => { e.preventDefault(); if (active >= 0 && list[active]) choose(list[active]); else go(q); }}>
        <label htmlFor="global-search" className="sr-only">Search FinCrime Academy</label>
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 shadow-card focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
          <Search className="h-5 w-5 text-muted" aria-hidden />
          <input
            id="global-search"
            role="combobox"
            aria-expanded={open && list.length > 0}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `sugg-${active}` : undefined}
            autoComplete="off"
            className="h-14 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
            placeholder="Search courses, questions, glossary, regulations…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(list.length - 1, a + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)); }
              if (e.key === "Escape") setOpen(false);
            }}
          />
          {q && (
            <button type="button" aria-label="Clear search" onClick={() => { setQ(""); setItems([]); }} className="text-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
      {open && list.length > 0 && (
        <ul id="search-suggestions" role="listbox" className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-lift">
          {showRecent && (
            <li className="flex items-center justify-between px-4 py-1.5 text-xs text-muted" role="presentation">
              <span>Recent searches</span>
              <button type="button" className="underline" onClick={() => { setRecent([]); try { localStorage.removeItem(KEY); } catch {} }}>Clear</button>
            </li>
          )}
          {list.map((it, i) => (
            <li key={it.title + i} id={`sugg-${i}`} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(it)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${i === active ? "bg-surface-2" : "hover:bg-surface-2"}`}>
                {showRecent ? <Clock className="h-4 w-4 text-muted" aria-hidden /> : <Search className="h-4 w-4 text-muted" aria-hidden />}
                <span className="flex-1 truncate">{it.title}</span>
                <span className="text-xs text-muted">{it.type}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
