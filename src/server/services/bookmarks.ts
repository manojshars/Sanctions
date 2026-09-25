import type { BookmarkEntity, BookmarkKind } from "@prisma/client";
import { db } from "@/lib/db";
import { NotFoundError } from "./courses";

const ENTITIES: BookmarkEntity[] = ["QUESTION", "COURSE", "VIDEO", "CASE_STUDY", "ARTICLE", "FLASHCARD", "GLOSSARY", "RESOURCE"];

async function exists(type: BookmarkEntity, id: string): Promise<boolean> {
  const where = { where: { id }, select: { id: true } } as const;
  switch (type) {
    case "QUESTION": return !!(await db.question.findUnique(where));
    case "COURSE": return !!(await db.course.findUnique(where));
    case "VIDEO": return !!(await db.videoResource.findUnique(where));
    case "CASE_STUDY": return !!(await db.caseStudy.findUnique(where));
    case "ARTICLE": return !!(await db.article.findUnique(where));
    case "FLASHCARD": return !!(await db.flashcard.findUnique(where));
    case "GLOSSARY": return !!(await db.glossaryTerm.findUnique(where));
    case "RESOURCE": return !!(await db.courseResource.findUnique(where));
  }
}

export async function toggleBookmark(userId: string, entityType: string, entityId: string, kind: BookmarkKind = "SAVE"): Promise<boolean> {
  if (!ENTITIES.includes(entityType as BookmarkEntity)) throw new NotFoundError("Unknown item type");
  const type = entityType as BookmarkEntity;
  if (!(await exists(type, entityId))) throw new NotFoundError("Item not found");
  const key = { userId_entityType_entityId_kind: { userId, entityType: type, entityId, kind } };
  const current = await db.bookmark.findUnique({ where: key });
  if (current) {
    await db.bookmark.delete({ where: key });
    return false;
  }
  await db.bookmark.create({ data: { userId, entityType: type, entityId, kind } });
  return true;
}
