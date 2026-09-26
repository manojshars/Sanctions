import { afterAll, describe, expect, it } from "vitest";
import { existsSync } from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { db } from "@/lib/db";
import { AuthorizationError } from "@/lib/rbac";
import { AdminInputError } from "@/server/services/admin/content";
import { createMaterial, deleteMaterial, updateMaterial } from "@/server/services/admin/materials";
import { AccessError, enroll, NotFoundError } from "@/server/services/courses";
import { downloadResource, listLibraryResources } from "@/server/services/resources";
import { freeCourseSlug, grantPremium, makeUser, premiumCourseSlug } from "../helpers";

async function pdf(pages = 2, title = "Training") {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage().drawText(`${title} page ${i + 1}`);
  return { name: `${title}.pdf`, type: "application/pdf", bytes: await doc.save() };
}
const storagePath = (key: string) => path.resolve(process.cwd(), "storage", key);
const created: string[] = [];

afterAll(async () => {
  const admin = await db.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  for (const id of created) await deleteMaterial({ id: admin.id, role: "ADMIN" }, id).catch(() => {});
});

describe("training material uploads", () => {
  it("only content managers can upload", async () => {
    const learner = await makeUser();
    const support = await makeUser({ role: "SUPPORT" });
    const topic = await db.topic.findUniqueOrThrow({ where: { slug: "sanctions" } });
    const input = { title: "Screening guide", topicId: topic.id, accessTier: "FREE", isPublished: true };
    await expect(createMaterial(learner, input, await pdf())).rejects.toBeInstanceOf(AuthorizationError);
    await expect(createMaterial(support, input, await pdf())).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects missing, non-PDF, damaged and active-content files, and requires a course or topic", async () => {
    const editor = await makeUser({ role: "EDITOR" });
    const topic = await db.topic.findUniqueOrThrow({ where: { slug: "sanctions" } });
    const base = { title: "Bad upload", topicId: topic.id, accessTier: "FREE", isPublished: true };
    await expect(createMaterial(editor, base, null)).rejects.toThrow(/Choose a PDF/);
    await expect(createMaterial(editor, base, { name: "notes.txt", type: "text/plain", bytes: new TextEncoder().encode("hello") })).rejects.toThrow(/Only PDF/);
    await expect(createMaterial(editor, base, { name: "fake.pdf", type: "application/pdf", bytes: new TextEncoder().encode("MZ not a pdf") })).rejects.toThrow(/not a valid PDF/);
    await expect(createMaterial(editor, base, { name: "broken.pdf", type: "application/pdf", bytes: new TextEncoder().encode("%PDF-1.7\ngarbage") })).rejects.toThrow(/could not be read/);
    const good = await pdf();
    const withJs = new Uint8Array([...good.bytes, ...new TextEncoder().encode("\n1 0 obj << /S /JavaScript /JS (app.alert(1)) >> endobj\n")]);
    await expect(createMaterial(editor, base, { ...good, bytes: withJs })).rejects.toThrow(/scripts/);
    await expect(createMaterial(editor, { ...base, topicId: "" }, await pdf())).rejects.toThrow(/course, or a topic/);
    expect(await db.courseResource.count({ where: { title: "Bad upload" } })).toBe(0);
  });

  it("uploads, replaces and deletes a course PDF, keeping storage in sync", async () => {
    const editor = await makeUser({ role: "EDITOR" });
    const course = await db.course.findUniqueOrThrow({ where: { slug: freeCourseSlug } });
    const m = await createMaterial(editor, { title: "KYC checklist", description: "One-page checklist", courseId: course.id, accessTier: "FREE", isPublished: true }, await pdf(3, "KYC checklist"));
    created.push(m.id);
    expect(m).toMatchObject({ mimeType: "application/pdf", pageCount: 3, filename: "KYC checklist.pdf", topicId: null, uploadedById: editor.id });
    expect(existsSync(storagePath(m.storageKey!))).toBe(true);

    const replaced = await updateMaterial(editor, m.id, { title: "KYC checklist v2", courseId: course.id, accessTier: "PREMIUM", isPublished: false }, await pdf(1, "v2"));
    expect(replaced).toMatchObject({ title: "KYC checklist v2", pageCount: 1, accessTier: "PREMIUM", isPublished: false });
    expect(replaced.storageKey).not.toBe(m.storageKey);
    expect(existsSync(storagePath(m.storageKey!))).toBe(false);

    const kept = await updateMaterial(editor, m.id, { title: "KYC checklist v3", courseId: course.id, accessTier: "FREE", isPublished: true }, null);
    expect(kept.storageKey).toBe(replaced.storageKey);

    await deleteMaterial(editor, m.id);
    expect(await db.courseResource.findUnique({ where: { id: m.id } })).toBeNull();
    expect(existsSync(storagePath(replaced.storageKey!))).toBe(false);
    expect((await db.auditLog.findMany({ where: { entityId: m.id } })).map((a) => a.action).sort()).toEqual(["material.create", "material.delete", "material.replace", "material.update"]);
    await expect(deleteMaterial(editor, m.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("serves course PDFs only to enrolled learners with access, and hides unpublished ones", async () => {
    const editor = await makeUser({ role: "EDITOR" });
    const course = await db.course.findUniqueOrThrow({ where: { slug: freeCourseSlug } });
    const file = await pdf(2, "Enrolled");
    const m = await createMaterial(editor, { title: "Enrolled only", courseId: course.id, accessTier: "FREE", isPublished: true }, file);
    created.push(m.id);
    const learner = await makeUser();
    await expect(downloadResource(learner, m.id)).rejects.toBeInstanceOf(AccessError);
    await enroll(learner, course.id);
    const f = await downloadResource(learner, m.id, course.slug);
    expect(f.mimeType).toBe("application/pdf");
    expect(Buffer.compare(f.body, Buffer.from(file.bytes))).toBe(0);
    await expect(downloadResource(learner, m.id, "some-other-course")).rejects.toBeInstanceOf(NotFoundError);

    await updateMaterial(editor, m.id, { title: "Enrolled only", courseId: course.id, accessTier: "FREE", isPublished: false }, null);
    await expect(downloadResource(learner, m.id)).rejects.toBeInstanceOf(NotFoundError);
    expect((await listLibraryResources()).some((r) => r.id === m.id)).toBe(false);
  });

  it("gates premium standalone library PDFs on the downloads entitlement", async () => {
    const editor = await makeUser({ role: "EDITOR" });
    const topic = await db.topic.findUniqueOrThrow({ where: { slug: "sanctions" } });
    const premium = await createMaterial(editor, { title: "Premium library guide", topicId: topic.id, accessTier: "PREMIUM", isPublished: true }, await pdf());
    const free = await createMaterial(editor, { title: "Free library guide", topicId: topic.id, accessTier: "FREE", isPublished: true }, await pdf());
    created.push(premium.id, free.id);
    const learner = await makeUser();
    expect((await downloadResource(learner, free.id)).body.byteLength).toBeGreaterThan(0);
    await expect(downloadResource(learner, premium.id)).rejects.toBeInstanceOf(AccessError);
    await grantPremium(learner.id);
    expect((await downloadResource(learner, premium.id)).body.byteLength).toBeGreaterThan(0);
    const listed = await listLibraryResources();
    expect(listed.find((r) => r.id === premium.id)).toMatchObject({ course: null, topic: { shortName: topic.shortName } });
  });

  it("accepts a PDF already uploaded to storage and refuses to reuse another material's file", async () => {
    const editor = await makeUser({ role: "EDITOR" });
    const topic = await db.topic.findUniqueOrThrow({ where: { slug: "sanctions" } });
    const file = await pdf(1, "Direct");
    const { putObject } = await import("@/lib/storage");
    const key = await putObject(file.bytes, "pdf", "materials");
    const m = await createMaterial(editor, { title: "Direct upload", topicId: topic.id, accessTier: "FREE", isPublished: true }, { ...file, storageKey: key });
    created.push(m.id);
    expect(m.storageKey).toBe(key);
    await expect(createMaterial(editor, { title: "Reuse", topicId: topic.id, accessTier: "FREE", isPublished: true }, { ...file, storageKey: key })).rejects.toThrow(/already attached/);
    expect(existsSync(storagePath(key))).toBe(true);

    const badKey = await putObject(new TextEncoder().encode("not a pdf"), "pdf", "materials");
    await expect(createMaterial(editor, { title: "Bad direct", topicId: topic.id, accessTier: "FREE", isPublished: true }, { name: "x.pdf", type: "application/pdf", bytes: new TextEncoder().encode("not a pdf"), storageKey: badKey })).rejects.toThrow(/not a valid PDF/);
    expect(existsSync(storagePath(badKey))).toBe(false);
  });

  it("course materials drop the standalone topic and reject unknown references", async () => {
    const editor = await makeUser({ role: "EDITOR" });
    const course = await db.course.findUniqueOrThrow({ where: { slug: premiumCourseSlug } });
    const topic = await db.topic.findUniqueOrThrow({ where: { slug: "fraud" } });
    const m = await createMaterial(editor, { title: "Ownership worksheet", courseId: course.id, topicId: topic.id, accessTier: "PREMIUM", isPublished: true }, await pdf());
    created.push(m.id);
    expect(m.topicId).toBeNull();
    await expect(createMaterial(editor, { title: "Ghost", courseId: "nope", accessTier: "FREE", isPublished: true }, await pdf())).rejects.toBeInstanceOf(AdminInputError);
  });
});
