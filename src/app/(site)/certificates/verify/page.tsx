import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Verify a certificate", description: "Check the authenticity of a FinCrime Academy completion certificate." };

async function lookup(form: FormData) {
  "use server";
  const code = String(form.get("code") ?? "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  redirect(`/certificates/verify/${encodeURIComponent(code || "none")}`);
}

export default function VerifyPage() {
  return (
    <div className="container max-w-xl py-16">
      <ShieldCheck className="h-10 w-10 text-accent" />
      <h1 className="mt-4 text-3xl font-bold">Verify a certificate</h1>
      <p className="mt-2 text-muted">Enter the verification code printed on the certificate (for example, ABCD-EFGH-JKLM).</p>
      <form action={lookup} className="mt-6 flex gap-2">
        <label htmlFor="code" className="sr-only">Verification code</label>
        <Input id="code" name="code" required placeholder="XXXX-XXXX-XXXX" autoComplete="off" />
        <Button type="submit">Verify</Button>
      </form>
    </div>
  );
}
