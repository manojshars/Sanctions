import { db } from "@/lib/db";
import { getEntitlements, hasFeature } from "@/lib/entitlements";
import { getObject } from "@/lib/storage";
import type { Role } from "@/lib/rbac";
import { AccessError, courseAccess, NotFoundError } from "./courses";

type User = { id: string; role: Role };
export type ResourceFile = { body: Buffer; mimeType: string; filename: string };

/**
 * Downloadable-material access rules:
 * - Course materials: the learner must be enrolled and have access to the course; PREMIUM materials
 *   also need the DOWNLOADS feature for the course topic (or a direct course grant).
 * - Standalone library materials: FREE ones are open to any signed-in user; PREMIUM ones need the
 *   DOWNLOADS feature for their topic.
 * Unpublished materials, and materials of unpublished courses, are never served here.
 */
export async function canDownloadResource(user: User, resourceId: string) {
  const r = await db.courseResource.findUnique({ where: { id: resourceId }, include: { course: { include: { topic: true } }, topic: true } });
  if (!r || !r.isPublished || (r.course && r.course.status !== "PUBLISHED")) return { resource: null, allowed: false };
  const ent = await getEntitlements(user);
  if (r.course) {
    const enrolled = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: r.course.id } }, select: { id: true } });
    const allowed = !!enrolled && (await courseAccess(user, r.course, ent)) && (r.accessTier === "FREE" || hasFeature(ent, "DOWNLOADS", r.course.topic.slug) || ent.courseIds.has(r.course.id));
    return { resource: r, allowed };
  }
  return { resource: r, allowed: r.accessTier === "FREE" || hasFeature(ent, "DOWNLOADS", r.topic?.slug) };
}

export async function readResourceFile(r: { storageKey: string | null; content: string; mimeType: string; filename: string }): Promise<ResourceFile> {
  const body = r.storageKey ? await getObject(r.storageKey) : Buffer.from(r.content, "utf8");
  return { body, mimeType: r.mimeType, filename: r.filename };
}

export async function downloadResource(user: User, resourceId: string, courseSlug?: string): Promise<ResourceFile> {
  const { resource, allowed } = await canDownloadResource(user, resourceId);
  if (!resource || (courseSlug !== undefined && resource.course?.slug !== courseSlug)) throw new NotFoundError("Resource not found");
  if (!allowed) throw new AccessError(resource.course ? "Enrol in the course (and hold a plan that includes downloads) to download this material." : "Downloading this material requires a plan that includes downloads.");
  return readResourceFile(resource);
}

/** Published materials for the public library page (metadata only). */
export async function listLibraryResources() {
  return db.courseResource.findMany({
    where: { isPublished: true, OR: [{ course: { status: "PUBLISHED" } }, { courseId: null }] },
    select: { id: true, title: true, description: true, mimeType: true, sizeBytes: true, pageCount: true, accessTier: true, course: { select: { title: true, slug: true } }, topic: { select: { shortName: true } } },
    orderBy: { title: "asc" },
  });
}

export function fileResponseHeaders(f: ResourceFile): HeadersInit {
  const textual = f.mimeType.startsWith("text/");
  return {
    "Content-Type": textual ? `${f.mimeType}; charset=utf-8` : f.mimeType,
    "Content-Disposition": `attachment; filename="${f.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
    "Content-Length": String(f.body.byteLength),
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  };
}
