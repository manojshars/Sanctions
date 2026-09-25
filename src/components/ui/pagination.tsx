import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ page, pages, makeHref }: { page: number; pages: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      <PageLink href={page > 1 ? makeHref(page - 1) : undefined} label="Previous page"><ChevronLeft className="h-4 w-4" /></PageLink>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center">
          {i > 0 && nums[i - 1] !== n - 1 && <span className="px-1 text-muted">…</span>}
          <Link href={makeHref(n)} aria-current={n === page ? "page" : undefined}
            className={cn("grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm", n === page ? "bg-navy text-white dark:bg-gold-400 dark:text-navy" : "hover:bg-surface-2")}>{n}</Link>
        </span>
      ))}
      <PageLink href={page < pages ? makeHref(page + 1) : undefined} label="Next page"><ChevronRight className="h-4 w-4" /></PageLink>
    </nav>
  );
}

function PageLink({ href, label, children }: { href?: string; label: string; children: React.ReactNode }) {
  if (!href) return <span aria-hidden className="grid h-9 w-9 place-items-center rounded-lg text-muted/40">{children}</span>;
  return <Link href={href} aria-label={label} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-surface-2">{children}</Link>;
}
