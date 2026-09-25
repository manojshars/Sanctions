import type { Metadata } from "next";
import { BookOpenCheck, Compass, Scale, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "About Us", description: "FinCrime Academy is a learning and professional development platform for financial crime prevention, investigation, risk and compliance." };

const PRINCIPLES = [
  { i: BookOpenCheck, t: "Practical first", d: "Content is built around what practitioners actually do: onboarding, screening, monitoring, investigating and reporting." },
  { i: Scale, t: "Accuracy and sources", d: "Regulatory content cites official sources and shows review dates. Where we are not certain of a date, we say so." },
  { i: ShieldCheck, t: "Honest claims", d: "Our certificates are internal completion certificates, not external accredited qualifications. Readiness scores are indicators, not guarantees." },
  { i: Compass, t: "Fictional training cases", d: "Case studies are fictional and anonymised unless clearly labelled otherwise." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About Us" title="A global learning platform for financial crime professionals" description="FinCrime Academy helps AML, sanctions, fraud and anti-corruption professionals build practical expertise — from first principles to advanced investigations." />
      <div className="container max-w-5xl py-12">
        <section className="grid gap-8 md:grid-cols-2">
          <div><h2 className="text-2xl font-bold">Our mission</h2><p className="mt-3 leading-relaxed text-ink/85">Financial crime harms people, markets and institutions. Preventing it depends on skilled professionals who understand the rules, the risks and the techniques criminals use. Our mission is to make high-quality, practical financial crime education accessible to individuals and teams worldwide.</p></div>
          <div><h2 className="text-2xl font-bold">Who we serve</h2><ul className="mt-3 space-y-1.5 text-ink/85"><li>• Financial crime, AML and sanctions compliance professionals</li><li>• Fraud investigators and ABC specialists</li><li>• Banking and fintech teams, auditors and risk managers</li><li>• Students preparing for financial crime certifications</li><li>• Corporate compliance and training teams</li></ul></div>
        </section>
        <section className="mt-12"><h2 className="text-2xl font-bold">Editorial principles</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">{PRINCIPLES.map(({ i: I, t, d }) => <div key={t} className="card p-6"><I className="h-6 w-6 text-accent" /><h3 className="mt-3 font-semibold">{t}</h3><p className="mt-1 text-sm text-muted">{d}</p></div>)}</div>
        </section>
        <section className="card mt-12 flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
          <div><h2 className="text-lg font-bold">Get in touch</h2><p className="text-sm text-muted">Questions, partnership ideas or content feedback — we&apos;d like to hear from you.</p></div>
          <div className="flex gap-2"><ButtonLink href="/contact">Contact us</ButtonLink><ButtonLink href="/academy" variant="secondary">Explore the Academy</ButtonLink></div>
        </section>
      </div>
    </>
  );
}
