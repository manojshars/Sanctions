import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({ eyebrow, title, description, href, linkLabel, className, align = "left" }: {
  eyebrow?: string; title: string; description?: string; href?: string; linkLabel?: string; className?: string; align?: "left" | "center";
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", align === "center" && "items-center text-center sm:flex-col sm:items-center", className)}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-muted">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
          {linkLabel ?? "View all"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, children, className }: { eyebrow?: string; title: string; description?: string; children?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("relative overflow-hidden border-b border-line bg-navy text-white", className)}>
      <div className="grid-bg absolute inset-0 opacity-60" aria-hidden />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" aria-hidden />
      <div className="container relative py-12 sm:py-16">
        {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">{eyebrow}</p>}
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-base text-white/75 sm:text-lg">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-sm text-white/60">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {it.href ? <Link href={it.href} className="hover:text-white">{it.label}</Link> : <span aria-current="page" className="text-white/85">{it.label}</span>}
            {i < items.length - 1 && <span aria-hidden>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
