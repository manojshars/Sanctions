import { db } from "@/lib/db";

export const SEARCH_TYPES = ["courses", "lessons", "questions", "flashcards", "videos", "cases", "glossary", "regulations", "articles", "help"] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];
export const SEARCH_LABELS: Record<SearchType, string> = {
  courses: "Courses", lessons: "Lessons", questions: "Questions", flashcards: "Flashcards", videos: "Videos", cases: "Case studies",
  glossary: "Glossary", regulations: "Regulatory references", articles: "Articles", help: "Help center",
};

export interface SearchHit { type: SearchType; id: string; title: string; snippet: string; href: string; topic?: string }

const ci = (q: string) => ({ contains: q, mode: "insensitive" as const });

function snip(text: string, q: string, len = 160): string {
  const plain = text.replace(/[#*_>`|-]+/g, " ").replace(/\s+/g, " ").trim();
  const i = plain.toLowerCase().indexOf(q.toLowerCase());
  const start = Math.max(0, i - 50);
  const s = plain.slice(start, start + len);
  return (start > 0 ? "…" : "") + s + (start + len < plain.length ? "…" : "");
}

/** Searches only published content. Question results expose stems only — never answers. */
export async function searchAll(qRaw: string, opts: { types?: SearchType[]; topic?: string; limit?: number } = {}): Promise<Record<SearchType, SearchHit[]>> {
  const q = qRaw.trim().slice(0, 100);
  const types = new Set(opts.types?.length ? opts.types : SEARCH_TYPES);
  const take = opts.limit ?? 8;
  const topic = opts.topic ? { topic: { slug: opts.topic } } : {};
  const empty = Object.fromEntries(SEARCH_TYPES.map((t) => [t, []])) as unknown as Record<SearchType, SearchHit[]>;
  if (q.length < 2) return empty;
  const run = <T,>(t: SearchType, fn: () => Promise<T[]>) => (types.has(t) ? fn() : Promise.resolve([] as T[]));
  const [courses, lessons, questions, cards, videos, cases, terms, regs, articles, help] = await Promise.all([
    run("courses", () => db.course.findMany({ where: { status: "PUBLISHED", ...topic, OR: [{ title: ci(q) }, { subtitle: ci(q) }, { overview: ci(q) }, { keywords: { has: q.toLowerCase() } }] }, include: { topic: true }, take })),
    run("lessons", () => db.lesson.findMany({ where: { module: { course: { status: "PUBLISHED", ...topic } }, OR: [{ title: ci(q) }, { content: ci(q) }] }, include: { module: { include: { course: { include: { topic: true } } } } }, take })),
    run("questions", () => db.question.findMany({ where: { status: "PUBLISHED", ...topic, OR: [{ stem: ci(q) }, { tags: { has: q } }] }, select: { id: true, stem: true, topic: { select: { name: true, slug: true } } }, take })),
    run("flashcards", () => db.flashcard.findMany({ where: { status: "PUBLISHED", deck: { ownerId: null, status: "PUBLISHED", ...topic }, OR: [{ front: ci(q) }, { back: ci(q) }] }, include: { deck: { include: { topic: true } } }, take })),
    run("videos", () => db.videoResource.findMany({ where: { status: "PUBLISHED", unavailable: false, ...topic, OR: [{ title: ci(q) }, { description: ci(q) }] }, include: { topic: true }, take })),
    run("cases", () => db.caseStudy.findMany({ where: { status: "PUBLISHED", ...topic, OR: [{ title: ci(q) }, { summary: ci(q) }, { background: ci(q) }] }, include: { topic: true }, take })),
    run("glossary", () => db.glossaryTerm.findMany({ where: { status: "PUBLISHED", ...topic, OR: [{ term: ci(q) }, { definition: ci(q) }] }, include: { topic: true }, take })),
    run("regulations", () => db.regulatoryReference.findMany({ where: { status: "PUBLISHED", ...(opts.topic ? topic : {}), OR: [{ title: ci(q) }, { summary: ci(q) }, { authority: ci(q) }] }, take })),
    run("articles", () => db.article.findMany({ where: { status: "PUBLISHED", ...(opts.topic ? topic : {}), OR: [{ title: ci(q) }, { excerpt: ci(q) }, { content: ci(q) }] }, take })),
    run("help", () => (opts.topic ? Promise.resolve([]) : db.helpArticle.findMany({ where: { status: "PUBLISHED", OR: [{ title: ci(q) }, { content: ci(q) }] }, take }))),
  ]);
  return {
    courses: courses.map((c) => ({ type: "courses", id: c.id, title: c.title, snippet: c.subtitle, href: `/academy/courses/${c.slug}`, topic: c.topic.name })),
    lessons: lessons.map((l) => ({ type: "lessons", id: l.id, title: l.title, snippet: `${l.module.course.title} — ${snip(l.content, q)}`, href: `/academy/courses/${l.module.course.slug}/lessons/${l.slug}`, topic: l.module.course.topic.name })),
    questions: questions.map((x) => ({ type: "questions", id: x.id, title: x.stem, snippet: "Practise this topic in the Question Bank", href: `/question-bank?topic=${x.topic.slug}`, topic: x.topic.name })),
    flashcards: cards.map((c) => ({ type: "flashcards", id: c.id, title: c.front, snippet: `${c.deck.title} deck`, href: `/flashcards/${c.deck.slug}`, topic: c.deck.topic?.name })),
    videos: videos.map((v) => ({ type: "videos", id: v.id, title: v.title, snippet: `Source: ${v.channelName}`, href: `/videos/${v.id}`, topic: v.topic.name })),
    cases: cases.map((c) => ({ type: "cases", id: c.id, title: c.title, snippet: c.summary, href: `/case-studies/${c.slug}`, topic: c.topic.name })),
    glossary: terms.map((t) => ({ type: "glossary", id: t.id, title: t.term, snippet: snip(t.definition, q), href: `/knowledge/glossary/${t.slug}`, topic: t.topic.name })),
    regulations: regs.map((r) => ({ type: "regulations", id: r.id, title: r.title, snippet: `${r.authority} · ${r.jurisdiction}`, href: `/knowledge/regulations?authority=${encodeURIComponent(r.authority)}` })),
    articles: articles.map((a) => ({ type: "articles", id: a.id, title: a.title, snippet: a.excerpt, href: `/knowledge/articles/${a.slug}` })),
    help: help.map((h) => ({ type: "help", id: h.id, title: h.title, snippet: snip(h.content, q), href: `/support/help/${h.slug}` })),
  };
}

export async function suggest(q: string): Promise<{ title: string; href: string; type: string }[]> {
  if (q.trim().length < 2) return [];
  const r = await searchAll(q, { types: ["courses", "glossary", "articles", "cases", "regulations"], limit: 3 });
  return [...r.courses, ...r.glossary, ...r.cases, ...r.articles, ...r.regulations].slice(0, 8).map((h) => ({ title: h.title, href: h.href, type: SEARCH_LABELS[h.type] }));
}
