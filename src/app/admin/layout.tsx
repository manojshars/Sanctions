import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { logoutAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · FinCrime Academy" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePermission("admin:access");
  const perms = [
    can(user.role, "analytics:view") && "analytics", can(user.role, "content:manage") && "content", can(user.role, "users:manage") && "users",
    can(user.role, "support:manage") && "support", can(user.role, "packages:manage") && "packages", can(user.role, "audit:view") && "audit",
  ].filter(Boolean) as string[];
  return (
    <div className="flex min-h-screen">
      <a href="#admin-main" className="skip-link">Skip to content</a>
      <aside className="hidden w-60 shrink-0 flex-col bg-navy p-4 lg:flex dark:bg-navy-900">
        <div className="[&_span]:!text-white [&_span:last-child]:!text-gold-300"><Logo /></div>
        <p className="mb-4 mt-6 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-300">Administration</p>
        <AdminNav perms={perms} />
        <div className="mt-auto space-y-1 border-t border-white/10 pt-4 text-sm">
          <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/65 hover:text-white"><ExternalLink className="h-4 w-4" /> View site</Link>
          <form action={logoutAction}><button className="w-full rounded-lg px-3 py-2 text-left text-white/65 hover:text-white">Sign out</button></form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-line bg-surface px-4 sm:px-6">
          <details className="lg:hidden"><summary className="cursor-pointer text-sm font-semibold">Menu</summary><div className="absolute z-50 mt-2 w-60 rounded-xl bg-navy p-3"><AdminNav perms={perms} /></div></details>
          <p className="hidden text-sm text-muted lg:block">Signed in as <span className="font-medium text-ink">{user.name}</span> · {user.role.toLowerCase()}</p>
          <ThemeToggle />
        </header>
        <main id="admin-main" className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
