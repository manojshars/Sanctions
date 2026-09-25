import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/section";
import { Badge, LevelBadge, TierBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/pagination";
import { BookmarkButton } from "@/components/common/bookmark-button";
import { titleCase } from "@/lib/utils";

export const metadata: Metadata = { title: "Browse questions", description: "Browse the published question bank by topic, type and difficulty." };
export const dynamic = "force-dynamic";
const PAGE = 20;

export default async function BrowseQuestions({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const user = await getCurrentUser();
  const where: Prisma.QuestionWhereInput = { status: "PUBLISHED" };
  if (sp.topic) where.topic = { slug: sp.topic };
  if (sp.type) where.type = sp.type as never;
  if (sp.difficulty) where.difficulty = sp.difficulty as never;
  if (sp.q) where.OR = [{ stem: { contains: sp.q, mode: "insensitive" } }, { tags: { has: sp.q } }];
  if (sp.saved === "1" && user) where.id = { in: (await db.bookmark.findMany({ where: { userId: user.id, entityType: "QUESTION" }, select: { entityId: true } })).map((b) => b.entityId) };
  const [topics, total, items] = await Promise.all([
    db.topic.findMany({ orderBy: { order: "asc" } }),
    db.question.count({ where }),
    db.question.findMany({ where, include: { topic: true }, orderBy: [{ topic: { order: "asc" } }, { createdAt: "asc" }], skip: (page - 1) * PAGE, take: PAGE }),
  ]);
  const marks = user ? await db.bookmark.findMany({ where: { userId: user.id, entityType: "QUESTION", entityId: { in: items.map((i) => i.id) } } }) : [];
  const href = (p: number) => { const u = new URLSearchParams(Object.entries({ ...sp, page: String(p) }).filter(([, v]) => v) as [string, string][]); return `/question-bank/browse?${u}`; };
  return (
    <>
      <PageHeader eyebrow="Question Bank" title="Browse questions" description="Question stems only — answers and explanations are revealed when you practise." />
      <div className="container py-10">
        <form className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" method="get">
          <Input name="q" defaultValue={sp.q} placeholder="Search questions" aria-label="Search questions" className="lg:col-span-2" />
          <Select name="topic" defaultValue={sp.topic ?? ""} aria-label="Topic"><option value="">All topics</option>{topics.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</Select>
          <Select name="type" defaultValue={sp.type ?? ""} aria-label="Question type"><option value="">All types</option>{["SINGLE", "MULTIPLE", "TRUE_FALSE", "SCENARIO", "MATCHING", "FILL_BLANK", "SHORT_ANSWER", "INVESTIGATION"].map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</Select>
          <Select name="difficulty" defaultValue={sp.difficulty ?? ""} aria-label="Difficulty"><option value="">Any difficulty</option><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></Select>
          <div className="flex items-center gap-2">
            {user && <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="saved" value="1" defaultChecked={sp.saved === "1"} /> Saved</label>}
            <Button type="submit" className="flex-1">Filter</Button>
          </div>
        </form>
        <p className="mb-3 text-sm text-muted">{total} questions</p>
        {items.length ? (
          <ul className="space-y-3">
            {items.map((q) => (
              <li key={q.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap gap-2"><Badge tone="brand">{q.topic.shortName}</Badge><Badge tone="outline">{titleCase(q.type)}</Badge><LevelBadge level={q.difficulty} /><TierBadge tier={q.accessTier} /></div>
                  <p className="font-medium">{q.stem}</p>
                  {q.tags.length > 0 && <p className="mt-1 text-xs text-muted">{q.tags.map((t) => `#${t}`).join(" ")}</p>}
                </div>
                {user && <div className="flex gap-2"><BookmarkButton entityType="QUESTION" entityId={q.id} initial={marks.some((m) => m.entityId === q.id && m.kind === "SAVE")} label="Bookmark" /></div>}
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No questions match" description="Adjust your filters." />}
        <Pagination page={page} pages={Math.ceil(total / PAGE)} makeHref={href} />
      </div>
    </>
  );
}
