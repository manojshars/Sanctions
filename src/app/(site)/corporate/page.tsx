import type { Metadata } from "next";
import { BarChart3, CalendarClock, ClipboardList, FileSpreadsheet, Lock, Presentation, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { managedOrgs } from "@/server/services/corporate";
import { PageHeader } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { InquiryForm } from "@/components/corporate/corporate-forms";

export const metadata: Metadata = { title: "Corporate Training", description: "Financial crime training for compliance teams: assignments, deadlines, progress dashboards and completion reports." };
export const dynamic = "force-dynamic";

const FEATURES = [
  { i: Users, t: "Team management", d: "Invite learners and managers, manage seats and membership." },
  { i: ClipboardList, t: "Course assignments", d: "Assign courses to individuals or groups with learning deadlines." },
  { i: BarChart3, t: "Progress dashboard", d: "Monitor enrolment, lesson progress and assessment results." },
  { i: FileSpreadsheet, t: "Completion reports", d: "Export completion and assessment reports as CSV for your records." },
  { i: Presentation, t: "Customised workshops", d: "Request tailored sessions for your products, jurisdictions and risks." },
  { i: Lock, t: "Tenant isolation", d: "Each organisation's data is strictly separated from every other organisation." },
];

export default async function CorporatePage() {
  const user = await getCurrentUser();
  const orgs = user ? await managedOrgs(user.id) : [];
  return (
    <>
      <PageHeader eyebrow="Corporate Training" title="Financial crime training for your whole team" description="Give compliance, operations and front-line teams structured learning, practical assessments and evidence of completion.">
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="#inquiry" variant="gold">Talk to our team</ButtonLink>
          {orgs.length > 0 && <ButtonLink href="/corporate/dashboard" className="border border-white/20 bg-transparent text-white hover:bg-white/10 dark:bg-transparent dark:text-white">Open corporate dashboard</ButtonLink>}
        </div>
      </PageHeader>
      <div className="container py-12">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{FEATURES.map(({ i: I, t, d }) => <div key={t} className="card p-6"><I className="h-6 w-6 text-accent" /><h2 className="mt-3 font-semibold">{t}</h2><p className="mt-1 text-sm text-muted">{d}</p></div>)}</div>
        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr]" id="inquiry">
          <div>
            <h2 className="text-2xl font-bold">How it works</h2>
            <ol className="mt-4 space-y-4 text-sm">
              {["Tell us about your team and training needs.", "We set up your organisation with a Corporate membership and seats.", "Managers invite learners and assign courses with deadlines.", "Track completion and results, and export reports for your records."].map((s, i) => (
                <li key={s} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-gold-300">{i + 1}</span><span className="pt-1">{s}</span></li>
              ))}
            </ol>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted"><CalendarClock className="h-4 w-4" /> We respond to enquiries by email.</p>
          </div>
          <div className="card p-6"><h2 className="mb-4 text-lg font-bold">Corporate enquiry</h2><InquiryForm type="CORPORATE" defaults={{ name: user?.name, email: user?.email }} /></div>
        </section>
      </div>
    </>
  );
}
