import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Clock, Info, Lock, Timer } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntitlements, hasFeature } from "@/lib/entitlements";
import { attemptHistory } from "@/server/services/attempts";
import { attemptPath } from "@/lib/paths";
import { PageHeader } from "@/components/ui/section";
import { AssessmentStart } from "@/components/practice/start-forms";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";
import { ScoreLine } from "@/components/charts/score-line";
import { formatDate, formatSeconds } from "@/lib/utils";

export const metadata: Metadata = { title: "Mock Examination Center", description: "Timed financial crime mock examinations with detailed review and analytics." };
export const dynamic = "force-dynamic";

export default async function MockExamsPage() {
  const user = await getCurrentUser();
  const ent = await getEntitlements(user);
  const [assessments, topics, poolTotal] = await Promise.all([
    db.assessment.findMany({ where: { status: "PUBLISHED", type: "MOCK_EXAM" }, orderBy: { order: "asc" } }),
    db.topic.findMany({ orderBy: { order: "asc" } }),
    db.question.count({ where: { status: "PUBLISHED" } }),
  ]);
  const history = user ? await attemptHistory(user.id, ["MOCK_EXAM", "READINESS"], 20) : [];
  const done = history.filter((h) => h.status !== "IN_PROGRESS").reverse();
  const canPremium = hasFeature(ent, "MOCK_EXAMS");
  return (
    <>
      <PageHeader eyebrow="Mock Examination Center" title="Timed examinations and exam readiness" description="Randomised question sets, a countdown timer, question navigator, mark-for-review, automatic submission and a detailed answer review.">
        <ButtonLink href="/mock-exams/readiness" variant="gold">Take the readiness assessment</ButtonLink>
      </PageHeader>
      <div className="container space-y-10 py-10">
        <Alert tone="info" title="Practice formats">These are configurable FinCrime Academy practice formats. They are not official external examination formats, and results do not guarantee success in any external certification exam. The current published pool contains {poolTotal} questions.</Alert>
        {history.some((h) => h.status === "IN_PROGRESS") && (
          <div className="card p-5"><h2 className="font-semibold">Examinations in progress</h2>
            <ul className="mt-2 space-y-2 text-sm">{history.filter((h) => h.status === "IN_PROGRESS").map((h) => <li key={h.id} className="flex items-center justify-between"><span>{h.assessment?.name} · started {formatDate(h.startedAt)}</span><ButtonLink size="sm" href={attemptPath(h.kind, h.id)}>Resume</ButtonLink></li>)}</ul>
          </div>
        )}
        <section className="grid gap-5 md:grid-cols-2">
          {assessments.map((a) => {
            const locked = a.accessTier === "PREMIUM" && !canPremium;
            return (
              <article key={a.id} className="card flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{a.name}</h2>
                    <p className="mt-1 text-sm text-muted">{a.description}</p>
                  </div>
                  {a.accessTier === "FREE" ? <Badge tone="success">Free</Badge> : <Badge tone="gold">Premium</Badge>}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
                  <span className="inline-flex items-center gap-1.5"><ClipboardList className="h-4 w-4" />{a.questionCount} questions</span>
                  {a.timeLimitMinutes && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{a.timeLimitMinutes} minutes</span>}
                  <span>Pass mark {a.passingScore}%</span>
                </div>
                <div className="mt-auto pt-5">
                  {locked ? (
                    <ButtonLink href="/pricing" variant="secondary"><Lock className="h-4 w-4" /> Unlock with Premium</ButtonLink>
                  ) : !user ? (
                    <ButtonLink href="/login?next=/mock-exams">Sign in to start</ButtonLink>
                  ) : a.configurable ? (
                    <AssessmentStart slug={a.slug} label={<><Timer className="h-4 w-4" /> Start configured exam</>}>
                      <div className="mb-4 grid gap-3 sm:grid-cols-3">
                        <div><label className="label" htmlFor={`qc-${a.id}`}>Questions</label><Select id={`qc-${a.id}`} name="questionCount" defaultValue={String(a.questionCount)}>{[10, 20, 30, 40, 60, 80, 100].map((n) => <option key={n} value={n}>{n}</option>)}</Select></div>
                        <div><label className="label" htmlFor={`tl-${a.id}`}>Time limit</label><Select id={`tl-${a.id}`} name="timeLimitMinutes" defaultValue={String(a.timeLimitMinutes ?? 60)}><option value="0">Untimed</option>{[15, 30, 45, 60, 90, 120].map((n) => <option key={n} value={n}>{n} min</option>)}</Select></div>
                        <div><label className="label" htmlFor={`df-${a.id}`}>Difficulty</label><Select id={`df-${a.id}`} name="difficulty" defaultValue=""><option value="">Any</option><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></Select></div>
                      </div>
                      <fieldset className="mb-4"><legend className="label">Topics (optional)</legend>
                        <div className="grid grid-cols-2 gap-1.5 text-sm">{topics.map((t) => <label key={t.slug} className="flex items-center gap-2"><input type="checkbox" name="topics" value={t.slug} className="accent-[#193B68]" />{t.shortName}</label>)}</div>
                      </fieldset>
                    </AssessmentStart>
                  ) : (
                    <AssessmentStart slug={a.slug} label={<><Timer className="h-4 w-4" /> Start examination</>} />
                  )}
                </div>
              </article>
            );
          })}
        </section>
        <section className="card p-6">
          <h2 className="flex items-center gap-2 font-semibold"><Info className="h-4 w-4 text-accent" /> Examination instructions</h2>
          <ul className="mt-3 grid gap-2 text-sm text-ink/85 md:grid-cols-2">
            <li>• Questions are randomly selected; each attempt uses a new set.</li>
            <li>• Answers save automatically as you go — you can leave and resume.</li>
            <li>• Use the navigator to move between questions and mark items for review.</li>
            <li>• Correct answers and explanations appear only after submission.</li>
            <li>• When the timer reaches zero, the exam is submitted automatically.</li>
            <li>• Multiple-select questions are scored all-or-nothing.</li>
          </ul>
        </section>
        <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="card p-6"><h2 className="font-semibold">Score history</h2>
            <div className="mt-4">{user ? <ScoreLine points={done.map((d) => ({ label: formatDate(d.submittedAt), value: d.score ?? 0 }))} /> : <p className="text-sm text-muted">Sign in to track your scores.</p>}</div>
          </div>
          <div className="card p-6"><h2 className="font-semibold">Examination history</h2>
            {history.length ? (
              <ul className="mt-3 divide-y divide-line text-sm">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={attemptPath(h.kind, h.id, h.status !== "IN_PROGRESS")} className="hover:text-brand">{h.assessment?.name ?? "Examination"}<span className="block text-xs text-muted">{formatDate(h.startedAt)}{h.durationSeconds ? ` · ${formatSeconds(h.durationSeconds)}` : ""}</span></Link>
                    {h.status === "IN_PROGRESS" ? <StatusBadge status="IN_PROGRESS" /> : <span className="font-semibold">{h.score}%{h.passed != null && <span className={h.passed ? "ml-1 text-success" : "ml-1 text-danger"}>{h.passed ? "✓" : "✗"}</span>}</span>}
                  </li>
                ))}
              </ul>
            ) : <EmptyState className="mt-3 py-8" title="No examinations yet" />}
          </div>
        </section>
      </div>
    </>
  );
}
