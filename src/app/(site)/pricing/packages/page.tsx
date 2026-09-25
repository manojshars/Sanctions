import type { Metadata } from "next";
import { Check, Package } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Learning Packages", description: "Focused financial crime learning bundles." };
export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const packages = await db.learningPackage.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, include: { _count: { select: { courses: true } } } });
  return (
    <>
      <PageHeader eyebrow="Pricing" title="Learning Packages" description="Bundles focused on a professional path. One-off payment, 12 months of access." />
      <div className="container grid gap-5 py-12 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((p) => (
          <article key={p.id} id={p.slug} className="card flex scroll-mt-24 flex-col p-6">
            <Package className="h-7 w-7 text-accent" />
            <h2 className="mt-3 text-lg font-bold">{p.name}</h2>
            <p className="mt-1 text-sm text-muted">{p.description}</p>
            <p className="mt-4 font-display text-2xl font-extrabold">{formatMoney(p.priceCents, p.currency)} <span className="text-sm font-normal text-muted">/ {p.durationDays} days</span></p>
            <ul className="mt-4 flex-1 space-y-2 text-sm">{p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-success" />{f}</li>)}<li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-success" />{p._count.courses} courses included</li></ul>
            <ButtonLink href={`/checkout?kind=package&slug=${p.slug}`} className="mt-6">Get {p.name}</ButtonLink>
          </article>
        ))}
      </div>
    </>
  );
}
