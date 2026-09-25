import type { Metadata } from "next";
import Link from "next/link";
import { Building2, LifeBuoy, Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/section";
import { InquiryForm } from "@/components/corporate/corporate-forms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Contact", description: "Contact FinCrime Academy." };

export default async function ContactPage() {
  const user = await getCurrentUser();
  return (
    <>
      <PageHeader eyebrow="Contact" title="Contact FinCrime Academy" description="Send us a message and our team will reply by email." />
      <div className="container grid max-w-5xl gap-8 py-12 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-6"><InquiryForm type="CONTACT" defaults={{ name: user?.name, email: user?.email }} /></div>
        <aside className="space-y-4">
          <div className="card flex gap-3 p-5"><LifeBuoy className="h-5 w-5 text-accent" /><div><p className="font-semibold">Account or technical help</p><p className="text-sm text-muted">For the fastest help, <Link href="/support/new" className="text-brand underline">open a support ticket</Link>.</p></div></div>
          <div className="card flex gap-3 p-5"><Building2 className="h-5 w-5 text-accent" /><div><p className="font-semibold">Team training</p><p className="text-sm text-muted">See <Link href="/corporate" className="text-brand underline">Corporate Training</Link>.</p></div></div>
          <div className="card flex gap-3 p-5"><Mail className="h-5 w-5 text-accent" /><div><p className="font-semibold">Privacy requests</p><p className="text-sm text-muted">Export or delete your data from <Link href="/settings" className="text-brand underline">Account settings</Link>.</p></div></div>
        </aside>
      </div>
    </>
  );
}
