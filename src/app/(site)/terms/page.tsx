import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/section";
import { Prose } from "@/components/ui/prose";

export const metadata: Metadata = { title: "Terms and Conditions" };

const CONTENT = `
*Template terms for FinCrime Academy. Review with qualified legal counsel before launch.*

## 1. The service
FinCrime Academy provides online educational content, assessments and tools about financial crime compliance. Content is for education only and is **not legal, regulatory or professional advice**. Always consult official sources and your organisation's policies.

## 2. Accounts
You must provide accurate information and keep your password secure. You are responsible for activity under your account. Do not share accounts.

## 3. Memberships and payments
Paid plans are billed in advance. Subscriptions renew until cancelled; cancellation takes effect at the end of the current period. Learning packages provide access for the stated period. Prices and features are shown on the Pricing page.

## 4. Certificates and assessments
Certificates confirm completion of FinCrime Academy courses and assessments. They are **internal completion certificates, not external accredited qualifications**. Readiness scores and mock examinations are educational indicators and do not guarantee success in any external examination. Our practice formats are not official formats of any certification body.

## 5. Acceptable use
Do not copy, scrape, resell or redistribute content (including questions and answers); attempt to bypass access controls; interfere with the platform; or upload unlawful or malicious files.

## 6. Third-party content
Curated videos are hosted by YouTube and remain the property of their creators. External links are provided for convenience.

## 7. Corporate accounts
Organisations are responsible for their managers' use of the platform and for having a lawful basis to review their learners' progress.

## 8. Liability
To the extent permitted by law, we are not liable for decisions made in reliance on educational content. Nothing limits liability that cannot be limited by law.

## 9. Changes and termination
We may update these terms with notice. You can close your account at any time from Account settings.

## 10. Governing law
[Jurisdiction to be confirmed.]
`;

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms and Conditions" />
      <div className="container max-w-3xl py-12"><div className="card p-6 sm:p-8"><Prose markdown={CONTENT} /></div></div>
    </>
  );
}
