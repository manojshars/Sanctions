import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, History, ListChecks, PlayCircle, Target } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntitlements, tierLabel } from "@/lib/entitlements";
import { attemptHistory, modeLabel, topicAccuracy } from "@/server/services/attempts";
import { attemptPath } from "@/lib/paths";
import { PageHeader } from "@/components/ui/section";
import { PracticeBuilder } from "@/components/practice/practice-builder";
import { QuickStart } from "@/components/practice/start-forms";
import { Alert, EmptyState, Progress, Stat } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, dayKey } from "@/lib/utils";
import { TopicIcon } from "@/lib/topic-icons";

export const metadata: Metadata = { title: "Question Bank", description: "Practise financial crime questions by topic and difficulty with detailed explanations." };
export const dynamic = "force-dynamic";

const FORMATS = ["Single answer", "Multiple select", "True / false", "Scenario-based", "Matching", "Fill in the blank", "Short answer", "Investigation exercises"];

export default async function QuestionBankPage({ searchParams }: { searchParams: Promise<{ topic?: string; mode?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const ent = await getEntitlements(user);
  const topics = await db.topic.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { questions: { where: { status: "PUBLISHED" } } } } } });
  const [total, free] = await Promise.all([db.question.count({ where: { status: "PUBLISHED" } }), db.question.count({ where: { status: "PUBLISHED", accessTier: "FREE" } })]);
  const history = user ? await attemptHistory(user.id, ["PRACTICE", "DAILY_CHALLENGE", "KNOWLEDGE_CHECK"], 8) : [];
  const inProgress = history.filter((h) => h.status === "IN_PROGRESS");
  const accuracy = user ? await topicAccuracy(user.id) : [];
  const answeredCount = accuracy.reduce((s, a) => s + a.total, 0);
  const correct = accuracy.reduce((s, a) => s + a.correct, 0);
  const today = dayKey();
  const daily = user ? await db.attempt.findFirst({ where: { userId: user.id, kind: "DAILY_CHALLENGE", config: { path: ["day"], equals: today } } }) : null;

  return (
    <>
      <PageHeader eyebrow="Practice" title="Question Bank" description={`${total} published questions across ${topics.length} topics, each with a detailed explanation. ${free} are free for all registered learners.`}>
        <div className="flex flex-wrap gap-2 text-xs text-white/70">{FORMATS.map((f) => <span key={f} className="rounded-full border border-white/15 px-2.5 py-1">{f}</span>)}</div>
      </PageHeader>
      <div className="container grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {sp.mode === "DAILY_CHALLENGE" && !user && <Alert tone="info">Sign in to take today&apos;s Daily Challenge.</Alert>}
          {user && ent.tier === "FREE" && <Alert tone="info" title="Free membership">You&apos;re practising with the free question set. <Link href="/pricing" className="font-semibold text-brand underline">Upgrade</Link> for the expanded bank and mock examinations.</Alert>}
          {inProgress.length > 0 && (
            <div className="card p-5">
              <h2 className="flex items-center gap-2 font-semibold"><PlayCircle className="h-5 w-5 text-accent" /> Resume unfinished sessions</h2>
              <ul className="mt-3 divide-y divide-line">
                {inProgress.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span>{modeLabel(a.kind, a.mode)} · {a.totalCount} questions · started {formatDate(a.startedAt)}</span>
                    <ButtonLink href={attemptPath(a.kind, a.id)} size="sm">Resume</ButtonLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <PracticeBuilder topics={topics.map((t) => ({ slug: t.slug, name: t.name, count: t._count.questions }))} defaultTopic={sp.topic} defaultMode={sp.mode} signedIn={!!user} />
          <section>
            <h2 className="mb-4 text-lg font-bold">Browse by topic</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {topics.map((t) => {
                const acc = accuracy.find((a) => a.topic === t.slug);
                return (
                  <div key={t.id} className="card flex items-center gap-4 p-4">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand"><TopicIcon slug={t.slug} className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{t.name}</p>
                      <p className="text-xs text-muted">{t._count.questions} questions{acc ? ` · your accuracy ${acc.accuracy}%` : ""}</p>
                      {acc && <Progress value={acc.accuracy} className="mt-1.5" label={`${t.name} accuracy`} />}
                    </div>
                    <QuickStart fields={{ mode: "QUICK", topic: t.slug }} label="Practise" size="sm" variant="secondary" />
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-sm"><Link href="/question-bank/browse" className="font-semibold text-brand hover:underline">Browse all questions →</Link></p>
          </section>
        </div>
        <aside className="space-y-5">
          <div className="card overflow-hidden">
            <div className="bg-navy p-5 text-white">
              <p className="flex items-center gap-2 text-sm font-semibold text-gold-300"><CalendarCheck className="h-4 w-4" /> Daily Challenge</p>
              <p className="mt-1 text-sm text-white/75">Five questions, the same for everyone today. One attempt per day.</p>
            </div>
            <div className="p-5">
              {daily ? (
                <ButtonLink href={attemptPath(daily.kind, daily.id, daily.status !== "IN_PROGRESS")} className="w-full" variant={daily.status === "IN_PROGRESS" ? "gold" : "secondary"}>
                  {daily.status === "IN_PROGRESS" ? "Continue today's challenge" : `View today's result (${daily.score}%)`}
                </ButtonLink>
              ) : (
                <QuickStart fields={{ mode: "DAILY_CHALLENGE" }} label="Take today's challenge" variant="gold" className="[&_button]:w-full" />
              )}
            </div>
          </div>
          {user ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Answered" value={answeredCount} icon={ListChecks} />
                <Stat label="Accuracy" value={answeredCount ? `${Math.round((correct / answeredCount) * 100)}%` : "—"} icon={Target} />
              </div>
              <div className="card p-5">
                <h2 className="flex items-center gap-2 font-semibold"><History className="h-4 w-4 text-accent" /> Recent sessions</h2>
                {history.length ? (
                  <ul className="mt-3 space-y-2 text-sm">
                    {history.map((a) => (
                      <li key={a.id}><Link href={attemptPath(a.kind, a.id, a.status !== "IN_PROGRESS")} className="flex items-center justify-between gap-2 rounded-lg p-1.5 hover:bg-surface-2">
                        <span>{a.kind === "KNOWLEDGE_CHECK" ? "Knowledge check" : modeLabel(a.kind, a.mode)}<span className="block text-xs text-muted">{formatDate(a.startedAt)}</span></span>
                        {a.status === "IN_PROGRESS" ? <StatusBadge status="IN_PROGRESS" /> : <span className="font-semibold">{a.score}%</span>}
                      </Link></li>
                    ))}
                  </ul>
                ) : <p className="mt-2 text-sm text-muted">No sessions yet.</p>}
              </div>
              <p className="text-xs text-muted">Access level: {tierLabel(ent)}</p>
            </>
          ) : (
            <EmptyState title="Track your performance" description="Create a free account to save sessions, bookmark questions and see topic accuracy." action={<ButtonLink href="/register?next=/question-bank">Create free account</ButtonLink>} />
          )}
        </aside>
      </div>
    </>
  );
}
