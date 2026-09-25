import Link from "next/link";
import { Logo } from "./logo";
import { FOOTER_NAV } from "@/lib/nav";
import { NewsletterForm } from "@/components/forms/newsletter-form";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-navy text-white/80 dark:bg-navy-900">
      <div className="container grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm">
          <div className="[&_span]:!text-white [&_span:last-child]:!text-gold-300"><Logo /></div>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Master Financial Crime. Strengthen Compliance. Advance Your Career.
          </p>
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-white">Newsletter</p>
            <NewsletterForm variant="dark" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FOOTER_NAV.map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-300">{col.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} className="text-sm text-white/70 transition hover:text-white">{i.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-3 py-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FinCrime Academy. Educational content only — not legal advice. Internal completion certificates are not external accredited qualifications.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy#cookies" className="hover:text-white">Cookies</Link>
            <Link href="/sitemap.xml" className="hover:text-white">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
