import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = ["", "/academy", "/academy/courses", "/question-bank", "/mock-exams", "/mock-exams/readiness", "/flashcards", "/flashcards/daily", "/videos", "/case-studies", "/knowledge", "/knowledge/glossary", "/knowledge/regulations", "/knowledge/typologies", "/resources", "/support", "/pricing", "/pricing/packages", "/corporate", "/about", "/contact", "/privacy", "/terms", "/certificates/verify"];
  const [courses, articles, terms, cases, videos, help, decks] = await Promise.all([
    db.course.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.article.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.glossaryTerm.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, lastReviewedAt: true } }),
    db.caseStudy.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.videoResource.findMany({ where: { status: "PUBLISHED" }, select: { id: true, updatedAt: true } }),
    db.helpArticle.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.flashcardDeck.findMany({ where: { status: "PUBLISHED", ownerId: null }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    ...statics.map((p) => ({ url: appUrl(p), changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...courses.map((c) => ({ url: appUrl(`/academy/courses/${c.slug}`), lastModified: c.updatedAt, priority: 0.8 })),
    ...articles.map((a) => ({ url: appUrl(`/knowledge/articles/${a.slug}`), lastModified: a.updatedAt })),
    ...terms.map((t) => ({ url: appUrl(`/knowledge/glossary/${t.slug}`), lastModified: t.lastReviewedAt })),
    ...cases.map((c) => ({ url: appUrl(`/case-studies/${c.slug}`), lastModified: c.updatedAt })),
    ...videos.map((v) => ({ url: appUrl(`/videos/${v.id}`), lastModified: v.updatedAt })),
    ...help.map((h) => ({ url: appUrl(`/support/help/${h.slug}`), lastModified: h.updatedAt })),
    ...decks.map((d) => ({ url: appUrl(`/flashcards/${d.slug}`), lastModified: d.updatedAt })),
  ];
}
