import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/section";
import { Prose } from "@/components/ui/prose";

export const metadata: Metadata = { title: "Privacy Policy" };

const CONTENT = `
*Template policy for FinCrime Academy. Review with qualified legal counsel before launch and complete the bracketed details.*

## Who we are
FinCrime Academy ("we", "us") operates this learning platform. Controller details: [legal entity name, registered address, contact email].

## What we collect
- **Account data:** name, email, password (stored only as a salted hash), experience level and interests.
- **Learning data:** enrolments, lesson progress, answers and scores, flashcard reviews, bookmarks, notes, certificates.
- **Support data:** tickets, messages and attachments you send us.
- **Billing data:** plan, payment status and invoices. Card details are processed by our payment provider and never stored by us.
- **Technical data:** session cookies, IP address and user agent for security and rate limiting.

## How we use it
To provide the service, personalise recommendations using your own learning data, issue certificates, respond to support requests, process payments, keep the platform secure, and — only with your consent — send newsletters or product updates.

## Legal bases
Contract (providing the service), legitimate interests (security, service improvement), consent (newsletter, optional analytics) and legal obligation (financial records).

## Sharing
Service providers acting on our instructions (hosting, database, email delivery, payment processing). Corporate managers can see the learning progress of members of their own organisation only. We do not sell personal data.

## Retention
Account and learning data are kept while your account is active. When you delete your account we erase personal and learning data; payment records are retained in anonymised form for the period required by law.

## Your rights
Access, portability (export your data from Account settings), rectification, erasure (delete your account from Account settings), objection and withdrawal of consent. Contact us to exercise other rights. You may complain to your data protection authority.

## Cookies {#cookies}
- **Strictly necessary:** \`fca_session\` (sign-in), \`fca_consent\` (your cookie choice). 
- **Preferences:** theme and recent searches are stored in your browser's local storage.
- **Analytics:** only with consent, privacy-conscious and aggregate. No advertising trackers.

## Changes
We will post updates here with a revised date.
`;

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <div className="container max-w-3xl py-12"><div className="card p-6 sm:p-8"><Prose markdown={CONTENT} /></div></div>
    </>
  );
}
