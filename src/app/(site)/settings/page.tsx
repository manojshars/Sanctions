import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, Download } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PasswordForm, DeleteAccountForm, ResendVerification } from "@/components/account/account-forms";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Account settings", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireUser("/settings");
  const user = await db.user.findUniqueOrThrow({ where: { id: session.id } });
  return (
    <div className="container max-w-3xl space-y-6 py-10">
      <div><p className="eyebrow">Account</p><h1 className="mt-1 text-3xl font-bold">Account settings</h1></div>
      <section className="card p-6">
        <h2 className="font-semibold">Email</h2>
        <p className="mt-1 text-sm">{user.email} {user.emailVerifiedAt ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Not verified</Badge>}</p>
        {!user.emailVerifiedAt && <div className="mt-3"><ResendVerification /></div>}
      </section>
      <section className="card p-6"><h2 className="mb-4 font-semibold">Change password</h2><PasswordForm /></section>
      <section className="card flex items-center justify-between gap-4 p-6"><div><h2 className="font-semibold">Billing & membership</h2><p className="text-sm text-muted">Plans, payment history and invoices.</p></div><Link href="/settings/billing" className="inline-flex items-center gap-2 text-sm font-semibold text-brand"><CreditCard className="h-4 w-4" /> Manage billing</Link></section>
      <section className="card p-6">
        <h2 className="font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-muted">Download a copy of your personal and learning data in JSON format.</p>
        <a href="/account-export" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-surface-2"><Download className="h-4 w-4" /> Export my data</a>
      </section>
      <section className="card border-danger/40 p-6">
        <h2 className="font-semibold text-danger">Delete account</h2>
        <p className="mt-1 text-sm text-muted">This permanently deletes your profile, learning progress, certificates and support history, and cancels active memberships. Payment records are retained in anonymised form where the law requires. This cannot be undone.</p>
        <div className="mt-4"><DeleteAccountForm /></div>
      </section>
    </div>
  );
}
