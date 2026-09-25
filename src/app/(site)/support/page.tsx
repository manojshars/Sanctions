import type { Metadata } from "next";
import Link from "next/link";
import { Award, CreditCard, GraduationCap, HelpCircle, KeyRound, Layers, LifeBuoy, ListChecks, MessageSquarePlus, Rocket, Search, Wrench } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/section";
import { Input } from "@/components/ui/form";
import { Button, ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { HELP_CATEGORIES, FAQS } from "@/lib/help-config";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Support Center", description: "Help articles, FAQs and support tickets for FinCrime Academy." };
export const dynamic = "force-dynamic";

const ICONS = { "Getting Started": Rocket, "Login and Account": KeyRound, "Course Enrollment": GraduationCap, "Question Bank": ListChecks, Flashcards: Layers, "Certificates and Assessments": Award, "Payments and Membership": CreditCard, "Technical Troubleshooting": Wrench } as const;

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const user = await getCurrentUser();
  const [articles, tickets] = await Promise.all([
    db.helpArticle.findMany({ where: { status: "PUBLISHED", ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { content: { contains: q, mode: "insensitive" } }] } : {}) }, orderBy: { title: "asc" } }),
    user ? db.supportTicket.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 5 }) : Promise.resolve([]),
  ]);
  return (
    <>
      <PageHeader eyebrow="Support Center" title="How can we help?" description="Search the help center, browse FAQs, or contact our support team.">
        <form method="get" className="flex max-w-xl gap-2" role="search">
          <label htmlFor="help-q" className="sr-only">Search the help center</label>
          <Input id="help-q" name="q" defaultValue={q} placeholder="Search help articles" className="h-12 border-white/20 bg-white text-navy" />
          <Button type="submit" variant="gold" size="lg"><Search className="h-4 w-4" /> Search</Button>
        </form>
      </PageHeader>
      <div className="container space-y-12 py-10">
        {q ? (
          <section><h2 className="text-xl font-bold">Results for “{q}”</h2>
            {articles.length ? <ul className="mt-4 space-y-2">{articles.map((a) => <li key={a.id}><Link href={`/support/help/${a.slug}`} className="card card-hover block p-4"><span className="font-semibold">{a.title}</span><span className="block text-xs text-muted">{a.category}</span></Link></li>)}</ul> : <p className="mt-3 text-muted">No articles found. <Link href="/support/new" className="text-brand underline">Contact support</Link>.</p>}
          </section>
        ) : (
          <section>
            <h2 className="mb-4 text-xl font-bold">Browse help topics</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {HELP_CATEGORIES.map((c) => {
                const Icon = ICONS[c as keyof typeof ICONS] ?? HelpCircle;
                const list = articles.filter((a) => a.category === c);
                return (
                  <div key={c} className="card p-5">
                    <Icon className="h-6 w-6 text-accent" />
                    <h3 className="mt-3 font-semibold">{c}</h3>
                    <ul className="mt-2 space-y-1 text-sm">{list.map((a) => <li key={a.id}><Link href={`/support/help/${a.slug}`} className="text-brand hover:underline">{a.title}</Link></li>)}</ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="mb-4 text-xl font-bold">Frequently asked questions</h2>
            <div className="space-y-2">{FAQS.map((f) => <details key={f.q} className="card p-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-sm text-ink/85">{f.a}</p></details>)}</div>
          </div>
          <div className="space-y-5">
            <div className="card p-6">
              <LifeBuoy className="h-7 w-7 text-accent" />
              <h2 className="mt-3 text-lg font-bold">Contact support</h2>
              <p className="mt-1 text-sm text-muted">Open a ticket and track its progress. We reply by email and in your Support Center.</p>
              <div className="mt-4 flex flex-wrap gap-2"><ButtonLink href="/support/new"><MessageSquarePlus className="h-4 w-4" /> Create a ticket</ButtonLink>{user && <ButtonLink href="/support/tickets" variant="secondary">My tickets</ButtonLink>}</div>
            </div>
            {tickets.length > 0 && (
              <div className="card p-6"><h2 className="font-semibold">Your recent tickets</h2>
                <ul className="mt-3 space-y-2 text-sm">{tickets.map((t) => <li key={t.id}><Link href={`/support/tickets/${t.number}`} className="flex items-center justify-between gap-2 hover:text-brand"><span>#{t.number} {t.subject}<span className="block text-xs text-muted">{formatDate(t.updatedAt)}</span></span><StatusBadge status={t.status} /></Link></li>)}</ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
