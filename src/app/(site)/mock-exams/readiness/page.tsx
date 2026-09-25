import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Gauge, ListChecks, Map } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { attemptHistory } from "@/server/services/attempts";
import { attemptPath } from "@/lib/paths";
import { PageHeader } from "@/components/ui/section";
import { AssessmentStart } from "@/components/practice/start-forms";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Exam Readiness Assessment", description: "Diagnose your strengths and gaps across financial crime topics." };
export const dynamic = "force-dynamic";

export default async function ReadinessPage() {
  const user = await getCurrentUser();
  const a = await db.assessment.findUnique({ where: { slug: "exam-readiness" } });
  const past = user ? (await attemptHistory(user.id, ["READINESS"], 10)) : [];
  return (
    <>
      <PageHeader eyebrow="Mock Examination Center" title="Exam Readiness Assessment" description="A diagnostic across all eleven topics. Get your overall score, topic-level accuracy, strengths, gaps and a personalised revision plan." />
      <div className="container grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[{ i: Gauge, t: "Overall score", d: "An educational indicator of your current knowledge." }, { i: ListChecks, t: "Topic accuracy", d: "Questions are balanced across topics." }, { i: Compass, t: "Strengths & gaps", d: "Areas above 75% and below 60% highlighted." }, { i: Map, t: "Revision plan", d: "Suggested courses, flashcards and your next practice session." }].map(({ i: I, t, d }) => (
              <div key={t} className="card flex gap-3 p-5"><I className="h-5 w-5 shrink-0 text-accent" /><div><p className="font-semibold">{t}</p><p className="text-sm text-muted">{d}</p></div></div>
            ))}
          </div>
          <Alert tone="warning" title="Important">Your readiness score is an educational indicator. It does not guarantee success in any external certification examination and is not affiliated with any certification body.</Alert>
          {a && (
            <div className="card p-6">
              <h2 className="text-lg font-bold">{a.name}</h2>
              <p className="mt-1 text-sm text-muted">{a.questionCount} questions · {a.timeLimitMinutes} minutes · free for registered learners (drawn from the questions available at your access level).</p>
              <div className="mt-5">{user ? <AssessmentStart slug={a.slug} label="Start readiness assessment" variant="gold" size="lg" /> : <ButtonLink href="/login?next=/mock-exams/readiness" size="lg">Sign in to start</ButtonLink>}</div>
            </div>
          )}
        </div>
        <aside className="card self-start p-5">
          <h2 className="font-semibold">Previous assessments</h2>
          {past.length ? <ul className="mt-3 space-y-2 text-sm">{past.map((p) => <li key={p.id}><Link href={attemptPath(p.kind, p.id, p.status !== "IN_PROGRESS")} className="flex justify-between rounded-lg p-1.5 hover:bg-surface-2"><span>{formatDate(p.startedAt)}</span><span className="font-semibold">{p.status === "IN_PROGRESS" ? "In progress" : `${p.score}%`}</span></Link></li>)}</ul> : <p className="mt-2 text-sm text-muted">No attempts yet.</p>}
        </aside>
      </div>
    </>
  );
}
