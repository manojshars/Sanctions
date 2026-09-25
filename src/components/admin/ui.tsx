import Link from "next/link";
import { Alert } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

export function AdminHeader({ title, description, actions, back }: { title: string; description?: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && <Link href={back.href} className="text-sm text-muted hover:text-ink">← {back.label}</Link>}
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Flash({ sp }: { sp: { saved?: string; error?: string } }) {
  if (sp.error) return <Alert tone="danger" className="mb-5">{sp.error}</Alert>;
  if (sp.saved) return <Alert tone="success" className="mb-5">Changes saved.</Alert>;
  return null;
}

export function Table({ head, children, className }: { head: string[]; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("card overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead className="bg-surface-2 text-left text-xs uppercase tracking-wider text-muted"><tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top", className)}>{children}</td>;
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="card p-5"><h2 className="mb-4 font-semibold">{title}</h2><div className="space-y-4">{children}</div></section>;
}

export function L({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: React.ReactNode; hint?: string }) {
  return <div><label htmlFor={htmlFor} className="label">{label}</label>{children}{hint && <p className="mt-1 text-xs text-muted">{hint}</p>}</div>;
}

export function SubmitBar({ label = "Save" }: { label?: string }) {
  return <div className="flex justify-end"><button type="submit" className="inline-flex h-10 items-center rounded-lg bg-navy px-5 text-sm font-medium text-white hover:bg-navy-600 dark:bg-gold-400 dark:text-navy">{label}</button></div>;
}

export function ActionButton({ action, label, tone = "default" }: { action: () => Promise<void>; label: string; tone?: "default" | "danger" | "primary" }) {
  return (
    <form action={action}>
      <button type="submit" className={cn("inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium",
        tone === "danger" ? "border-danger/40 text-danger hover:bg-danger/10" : tone === "primary" ? "border-transparent bg-navy text-white dark:bg-gold-400 dark:text-navy" : "border-line hover:bg-surface-2")}>{label}</button>
    </form>
  );
}
