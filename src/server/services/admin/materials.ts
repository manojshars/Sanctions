import { z } from "zod";
import { db } from "@/lib/db";
import { assertCan, type Role } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { deleteObject, putObject, UploadError, validatePdf } from "@/lib/storage";
import { NotFoundError } from "../courses";
import { AdminInputError } from "./content";

type Actor = { id: string; role: Role };
export type UploadedFile = { name: string; type: string; bytes: Uint8Array };

const opt = (v: unknown) => (v === undefined || v === null || (typeof v === "string" && v.trim() === "") ? null : v);

export const materialSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.preprocess(opt, z.string().trim().max(1000).nullable()),
    courseId: z.preprocess(opt, z.string().nullable()),
    topicId: z.preprocess(opt, z.string().nullable()),
    accessTier: z.enum(["FREE", "PREMIUM"]),
    isPublished: z.boolean(),
  })
  .refine((d) => d.courseId || d.topicId, { message: "Choose a course, or a topic for a standalone library item", path: ["courseId"] });

async function checkRefs(d: z.infer<typeof materialSchema>) {
  if (d.courseId && !(await db.course.findUnique({ where: { id: d.courseId }, select: { id: true } }))) throw new AdminInputError("Course not found");
  if (d.topicId && !(await db.topic.findUnique({ where: { id: d.topicId }, select: { id: true } }))) throw new AdminInputError("Topic not found");
  // A course-bound material takes its topic from the course.
  return { ...d, topicId: d.courseId ? null : d.topicId };
}

async function storePdf(file: UploadedFile) {
  try {
    const { safeName, pageCount } = await validatePdf(file.name, file.type, file.bytes);
    const storageKey = await putObject(file.bytes, "pdf");
    return { filename: safeName, mimeType: "application/pdf", storageKey, sizeBytes: file.bytes.byteLength, pageCount, content: "" };
  } catch (e) {
    if (e instanceof UploadError) throw new AdminInputError(e.message);
    throw e;
  }
}

export async function createMaterial(actor: Actor, raw: unknown, file: UploadedFile | null) {
  assertCan(actor.role, "content:manage");
  const d = await checkRefs(materialSchema.parse(raw));
  if (!file) throw new AdminInputError("Choose a PDF file to upload.");
  const stored = await storePdf(file);
  try {
    const m = await db.courseResource.create({ data: { ...d, ...stored, uploadedById: actor.id } });
    await audit(actor.id, "material.create", "CourseResource", m.id, { filename: m.filename, sizeBytes: m.sizeBytes });
    return m;
  } catch (e) {
    await deleteObject(stored.storageKey).catch(() => {});
    throw e;
  }
}

/** Updates details and, when a new file is given, replaces the stored PDF. */
export async function updateMaterial(actor: Actor, id: string, raw: unknown, file: UploadedFile | null) {
  assertCan(actor.role, "content:manage");
  const existing = await db.courseResource.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Material not found");
  const d = await checkRefs(materialSchema.parse(raw));
  const stored = file ? await storePdf(file) : null;
  try {
    const m = await db.courseResource.update({ where: { id }, data: { ...d, ...(stored ?? {}), uploadedById: existing.uploadedById ?? actor.id } });
    if (stored && existing.storageKey) await deleteObject(existing.storageKey).catch(() => {});
    await audit(actor.id, stored ? "material.replace" : "material.update", "CourseResource", id, stored ? { filename: m.filename, sizeBytes: m.sizeBytes } : undefined);
    return m;
  } catch (e) {
    if (stored) await deleteObject(stored.storageKey).catch(() => {});
    throw e;
  }
}

export async function deleteMaterial(actor: Actor, id: string) {
  assertCan(actor.role, "content:manage");
  const m = await db.courseResource.findUnique({ where: { id } });
  if (!m) throw new NotFoundError("Material not found");
  await db.$transaction([
    db.bookmark.deleteMany({ where: { entityType: "RESOURCE", entityId: id } }),
    db.courseResource.delete({ where: { id } }),
  ]);
  if (m.storageKey) await deleteObject(m.storageKey).catch(() => {});
  await audit(actor.id, "material.delete", "CourseResource", id, { title: m.title, filename: m.filename });
}

export async function listMaterials(filter: { q?: string; scope?: "course" | "library"; page?: number }) {
  const where = {
    ...(filter.q ? { OR: [{ title: { contains: filter.q, mode: "insensitive" as const } }, { filename: { contains: filter.q, mode: "insensitive" as const } }] } : {}),
    ...(filter.scope === "course" ? { courseId: { not: null } } : filter.scope === "library" ? { courseId: null } : {}),
  };
  const page = Math.max(1, filter.page ?? 1);
  const [items, total] = await Promise.all([
    db.courseResource.findMany({
      where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * 25, take: 25,
      select: { id: true, title: true, filename: true, mimeType: true, sizeBytes: true, pageCount: true, accessTier: true, isPublished: true, storageKey: true, updatedAt: true, course: { select: { id: true, title: true } }, topic: { select: { shortName: true } } },
    }),
    db.courseResource.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / 25)) };
}
