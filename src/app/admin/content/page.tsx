import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Flash, L, SubmitBar } from "@/components/admin/ui";
import { Input, Select, Textarea } from "@/components/ui/form";
import { StatusBadge } from "@/components/ui/badge";
import { saveKnowledgeAction } from "@/server/actions/admin";
import type { KnowledgeKind } from "@/server/services/admin/content";
import { cn } from "@/lib/utils";

export const metadata = { title: "Knowledge & help" };

const KINDS: { id: KnowledgeKind; label: string }[] = [
  { id: "article", label: "Articles" }, { id: "glossary", label: "Glossary" }, { id: "regulation", label: "Regulatory references" }, { id: "typology", label: "Typologies" }, { id: "help", label: "Help articles" },
];
const STATUS = (v?: string) => <L label="Status" htmlFor="status"><Select id="status" name="status" defaultValue={v ?? "DRAFT"}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></Select></L>;
const d = (x?: Date | null) => (x ? x.toISOString().slice(0, 10) : "");

export default async function AdminContent({ searchParams }: { searchParams: Promise<{ kind?: string; id?: string; saved?: string; error?: string }> }) {
  await requirePermission("content:manage");
  const sp = await searchParams;
  const kind = (KINDS.find((k) => k.id === sp.kind)?.id ?? "article") as KnowledgeKind;
  const topics = await db.topic.findMany({ orderBy: { order: "asc" } });
  const topicSel = (v?: string | null, optional = false) => <L label="Topic" htmlFor="topicId"><Select id="topicId" name="topicId" defaultValue={v ?? ""}>{optional && <option value="">None</option>}{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></L>;
  let items: { id: string; label: string; status: string }[] = [];
  let form: React.ReactNode = null;
  const action = saveKnowledgeAction.bind(null, kind, sp.id ?? null);

  if (kind === "article") {
    items = (await db.article.findMany({ orderBy: { updatedAt: "desc" } })).map((x) => ({ id: x.id, label: x.title, status: x.status }));
    const a = sp.id ? await db.article.findUnique({ where: { id: sp.id } }) : null;
    form = (<>
      <L label="Title" htmlFor="title"><Input id="title" name="title" defaultValue={a?.title} required /></L>
      <L label="Excerpt" htmlFor="excerpt"><Input id="excerpt" name="excerpt" defaultValue={a?.excerpt} required /></L>
      <div className="grid gap-3 sm:grid-cols-3"><L label="Category" htmlFor="category"><Select id="category" name="category" defaultValue={a?.category}>{["EDUCATIONAL", "REGULATORY_EXPLAINER", "TRENDS", "INVESTIGATION_GUIDE", "CASE_ANALYSIS", "CONTROL_GUIDANCE"].map((c) => <option key={c}>{c}</option>)}</Select></L>{topicSel(a?.topicId, true)}<L label="Reading minutes" htmlFor="readingMinutes"><Input id="readingMinutes" name="readingMinutes" type="number" defaultValue={a?.readingMinutes ?? 5} /></L></div>
      <L label="Content (Markdown)" htmlFor="content"><Textarea id="content" name="content" defaultValue={a?.content} className="min-h-[300px] font-mono text-xs" required /></L>
      <L label="Sources" htmlFor="sources" hint="One per line: Title | https://url — required for regulatory explainers"><Textarea id="sources" name="sources" defaultValue={((a?.sources as { title: string; url: string }[]) ?? []).map((s) => `${s.title} | ${s.url}`).join("\n")} /></L>
      {STATUS(a?.status)}</>);
  } else if (kind === "glossary") {
    items = (await db.glossaryTerm.findMany({ orderBy: { term: "asc" } })).map((x) => ({ id: x.id, label: x.term, status: x.status }));
    const g = sp.id ? await db.glossaryTerm.findUnique({ where: { id: sp.id } }) : null;
    form = (<>
      <div className="grid gap-3 sm:grid-cols-2"><L label="Term" htmlFor="term"><Input id="term" name="term" defaultValue={g?.term} required /></L>{topicSel(g?.topicId)}</div>
      <L label="Definition" htmlFor="definition"><Textarea id="definition" name="definition" defaultValue={g?.definition} required /></L>
      <L label="Practical example" htmlFor="example"><Textarea id="example" name="example" defaultValue={g?.example ?? ""} className="min-h-[70px]" /></L>
      <L label="Related terms" htmlFor="relatedTerms" hint="Comma separated"><Input id="relatedTerms" name="relatedTerms" defaultValue={g?.relatedTerms.join(", ")} /></L>
      <div className="grid gap-3 sm:grid-cols-2"><L label="Source reference" htmlFor="sourceReference"><Input id="sourceReference" name="sourceReference" defaultValue={g?.sourceReference ?? ""} /></L><L label="Source URL" htmlFor="sourceUrl"><Input id="sourceUrl" name="sourceUrl" type="url" defaultValue={g?.sourceUrl ?? ""} /></L></div>
      {STATUS(g?.status)}</>);
  } else if (kind === "regulation") {
    items = (await db.regulatoryReference.findMany({ orderBy: [{ jurisdiction: "asc" }, { title: "asc" }] })).map((x) => ({ id: x.id, label: `${x.authority}: ${x.title}`, status: x.status }));
    const r = sp.id ? await db.regulatoryReference.findUnique({ where: { id: sp.id } }) : null;
    form = (<>
      <div className="grid gap-3 sm:grid-cols-2"><L label="Authority" htmlFor="authority"><Input id="authority" name="authority" defaultValue={r?.authority} required /></L><L label="Jurisdiction" htmlFor="jurisdiction"><Input id="jurisdiction" name="jurisdiction" defaultValue={r?.jurisdiction} required /></L></div>
      <L label="Title" htmlFor="title"><Input id="title" name="title" defaultValue={r?.title} required /></L>
      <L label="Summary" htmlFor="summary"><Textarea id="summary" name="summary" defaultValue={r?.summary} required /></L>
      <L label="Official source URL" htmlFor="officialUrl"><Input id="officialUrl" name="officialUrl" type="url" defaultValue={r?.officialUrl} required /></L>
      <div className="grid gap-3 sm:grid-cols-3"><L label="Published (verified only)" htmlFor="publishedDate"><Input id="publishedDate" name="publishedDate" type="date" defaultValue={d(r?.publishedDate)} /></L><L label="Effective (verified only)" htmlFor="effectiveDate"><Input id="effectiveDate" name="effectiveDate" type="date" defaultValue={d(r?.effectiveDate)} /></L><L label="Currency" htmlFor="regStatus"><Select id="regStatus" name="regStatus" defaultValue={r?.regStatus ?? "CURRENT"}><option>CURRENT</option><option>HISTORICAL</option></Select></L></div>
      <L label="Date note" htmlFor="dateNote"><Input id="dateNote" name="dateNote" defaultValue={r?.dateNote ?? ""} /></L>
      <div className="grid gap-3 sm:grid-cols-2">{topicSel(r?.topicId, true)}{STATUS(r?.status)}</div></>);
  } else if (kind === "typology") {
    items = (await db.typology.findMany({ orderBy: { title: "asc" } })).map((x) => ({ id: x.id, label: x.title, status: x.status }));
    const t = sp.id ? await db.typology.findUnique({ where: { id: sp.id } }) : null;
    form = (<>
      <div className="grid gap-3 sm:grid-cols-2"><L label="Title" htmlFor="title"><Input id="title" name="title" defaultValue={t?.title} required /></L><L label="Category" htmlFor="category"><Select id="category" name="category" defaultValue={t?.category}>{["MONEY_LAUNDERING", "SANCTIONS_EVASION", "FRAUD", "ABC", "TRADE_BASED", "CUSTOMER_RISK", "TRANSACTION"].map((c) => <option key={c}>{c}</option>)}</Select></L></div>
      <L label="Description" htmlFor="description"><Textarea id="description" name="description" defaultValue={t?.description} required /></L>
      <L label="Indicators" htmlFor="indicators" hint="One per line"><Textarea id="indicators" name="indicators" defaultValue={t?.indicators.join("\n")} /></L>
      <L label="Example" htmlFor="example"><Textarea id="example" name="example" defaultValue={t?.example ?? ""} className="min-h-[70px]" /></L>
      <div className="grid gap-3 sm:grid-cols-2"><L label="Source reference" htmlFor="sourceReference"><Input id="sourceReference" name="sourceReference" defaultValue={t?.sourceReference ?? ""} /></L><L label="Source URL" htmlFor="sourceUrl"><Input id="sourceUrl" name="sourceUrl" type="url" defaultValue={t?.sourceUrl ?? ""} /></L></div>
      {STATUS(t?.status)}</>);
  } else {
    items = (await db.helpArticle.findMany({ orderBy: [{ category: "asc" }, { title: "asc" }] })).map((x) => ({ id: x.id, label: `${x.category}: ${x.title}`, status: x.status }));
    const h = sp.id ? await db.helpArticle.findUnique({ where: { id: sp.id } }) : null;
    form = (<>
      <div className="grid gap-3 sm:grid-cols-2"><L label="Title" htmlFor="title"><Input id="title" name="title" defaultValue={h?.title} required /></L><L label="Category" htmlFor="category"><Input id="category" name="category" defaultValue={h?.category} required /></L></div>
      <L label="Content (Markdown)" htmlFor="content"><Textarea id="content" name="content" defaultValue={h?.content} className="min-h-[240px] font-mono text-xs" required /></L>
      <L label="Related article slugs" htmlFor="relatedSlugs" hint="Comma separated"><Input id="relatedSlugs" name="relatedSlugs" defaultValue={h?.relatedSlugs.join(", ")} /></L>
      {STATUS(h?.status)}</>);
  }

  return (
    <>
      <AdminHeader title="Knowledge & help content" description="Every save updates the last-reviewed date." />
      <nav className="mb-5 flex flex-wrap gap-2">{KINDS.map((k) => <Link key={k.id} href={`/admin/content?kind=${k.id}`} className={cn("rounded-full border px-3 py-1 text-sm", kind === k.id ? "border-navy bg-navy text-white dark:border-gold-400 dark:bg-gold-400 dark:text-navy" : "border-line")}>{k.label}</Link>)}</nav>
      <Flash sp={sp} />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="card max-h-[75vh] overflow-y-auto p-2">
          <Link href={`/admin/content?kind=${kind}`} className="block rounded-lg px-3 py-2 text-sm font-semibold text-brand hover:bg-surface-2">+ New</Link>
          {items.map((i) => <Link key={i.id} href={`/admin/content?kind=${kind}&id=${i.id}`} className={cn("flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-2", sp.id === i.id && "bg-surface-2")}><span className="line-clamp-1">{i.label}</span><StatusBadge status={i.status} /></Link>)}
        </div>
        <form action={action} className="card space-y-4 p-5" key={`${kind}-${sp.id ?? "new"}`}>
          <h2 className="font-semibold">{sp.id ? "Edit" : "New"} {KINDS.find((k) => k.id === kind)?.label.replace(/s$/, "").toLowerCase()}</h2>
          {form}
          <SubmitBar />
        </form>
      </div>
    </>
  );
}
