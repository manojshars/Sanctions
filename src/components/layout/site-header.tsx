"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LayoutDashboard, LogOut, Menu, Search, Settings, Shield, User, X, GraduationCap, Building2 } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { MAIN_NAV, type NavGroup } from "@/lib/nav";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/actions/auth";

type HeaderUser = { name: string; email: string; isStaff: boolean; isOrgManager: boolean } | null;

function isActive(pathname: string, g: NavGroup) {
  if (g.href) return pathname === g.href || pathname.startsWith(g.href + "/");
  return !!g.items?.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
}

function Dropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div ref={ref} className="relative" onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)} onMouseEnter={() => setOpen(true)}
        className={cn("flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition hover:text-ink", isActive(pathname, group) ? "text-ink" : "text-muted")}>
        {group.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 pt-2">
          <div className="w-[340px] animate-fade-up rounded-2xl border border-line bg-surface p-2 shadow-lift">
            {group.items!.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2.5 hover:bg-surface-2">
                <span className="block text-sm font-semibold text-ink">{item.label}</span>
                {item.description && <span className="block text-xs text-muted">{item.description}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ user }: { user: NonNullable<HeaderUser> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Account menu"
        className="grid h-9 w-9 place-items-center rounded-full bg-navy text-xs font-bold text-gold-300 ring-2 ring-gold-400/40 dark:bg-gold-400 dark:text-navy">
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 animate-fade-up rounded-2xl border border-line bg-surface p-2 shadow-lift">
          <div className="border-b border-line px-3 pb-3 pt-2">
            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <nav className="py-1 text-sm">
            <MenuLink href="/dashboard" icon={LayoutDashboard}>Dashboard</MenuLink>
            <MenuLink href="/my-learning" icon={GraduationCap}>My Learning</MenuLink>
            <MenuLink href="/profile" icon={User}>Profile</MenuLink>
            <MenuLink href="/settings" icon={Settings}>Account settings</MenuLink>
            {user.isOrgManager && <MenuLink href="/corporate/dashboard" icon={Building2}>Corporate dashboard</MenuLink>}
            {user.isStaff && <MenuLink href="/admin" icon={Shield}>Admin</MenuLink>}
          </nav>
          <form action={logoutAction} className="border-t border-line pt-1">
            <button type="submit" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink">
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon: Icon, children }: { href: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-ink/90 hover:bg-surface-2">
      <Icon className="h-4 w-4 text-muted" aria-hidden /> {children}
    </Link>
  );
}

export function SiteHeader({ user, unread }: { user: HeaderUser; unread: number }) {
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => setMobile(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
  }, [mobile]);

  return (
    <header className={cn("sticky top-0 z-40 border-b transition-colors", scrolled ? "border-line bg-surface/85 backdrop-blur-lg" : "border-transparent bg-canvas/80 backdrop-blur")}>
      <div className="container flex h-16 items-center gap-4">
        <Logo />
        <nav aria-label="Main" className="ml-4 hidden items-center lg:flex">
          {MAIN_NAV.map((g) =>
            g.items ? (
              <Dropdown key={g.label} group={g} pathname={pathname} />
            ) : (
              <Link key={g.href} href={g.href!} aria-current={isActive(pathname, g) ? "page" : undefined}
                className={cn("rounded-lg px-3 py-2 text-sm font-medium transition hover:text-ink", isActive(pathname, g) ? "text-ink" : "text-muted")}>
                {g.label}
              </Link>
            ),
          )}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Link href="/search" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink" aria-label="Search">
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/notifications" className="relative grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
                <Bell className="h-[18px] w-[18px]" />
                {unread > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-navy">{unread > 9 ? "9+" : unread}</span>}
              </Link>
              <Link href="/my-learning" className={buttonClass("secondary", "sm", "ml-1 hidden md:inline-flex")}>My Learning</Link>
              <div className="ml-1"><UserMenu user={user} /></div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className={buttonClass("ghost", "sm")}>Log in</Link>
              <Link href="/register" className={buttonClass("primary", "sm")}>Register</Link>
            </div>
          )}
          <button type="button" className="grid h-9 w-9 place-items-center rounded-lg text-ink hover:bg-surface-2 lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu" aria-expanded={mobile}>
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setMobile(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-surface shadow-lift">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <Logo />
              <button type="button" onClick={() => setMobile(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-surface-2" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex-1 space-y-1 p-4">
              <Link href="/" className="block rounded-lg px-3 py-2.5 font-medium hover:bg-surface-2">Home</Link>
              {MAIN_NAV.map((g) =>
                g.items ? (
                  <div key={g.label} className="pt-3">
                    <p className="eyebrow px-3 pb-1">{g.label}</p>
                    {g.items.map((i) => (
                      <Link key={i.href} href={i.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2">{i.label}</Link>
                    ))}
                  </div>
                ) : (
                  <Link key={g.href} href={g.href!} className="block rounded-lg px-3 py-2.5 font-medium hover:bg-surface-2">{g.label}</Link>
                ),
              )}
            </nav>
            <div className="border-t border-line p-4">
              {user ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/dashboard" className={buttonClass("secondary", "md")}>Dashboard</Link>
                  <Link href="/my-learning" className={buttonClass("primary", "md")}>My Learning</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" className={buttonClass("secondary", "md")}>Log in</Link>
                  <Link href="/register" className={buttonClass("primary", "md")}>Register</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
