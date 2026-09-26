"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import type { ContentStatus } from "@prisma/client";
import { requireActionPermission } from "@/lib/auth/session";
import { AuthorizationError, type Permission, type Role } from "@/lib/rbac";
import { AccessError, NotFoundError } from "@/server/services/courses";
import {
  AdminInputError, deleteCard, deleteLesson, deleteModule, saveCard, saveCaseStudy, saveCourse, saveDeck, saveKnowledge, saveLesson, saveModule,
  savePlaylist, saveVideo, setCourseStatus, setVideoUnavailable, type KnowledgeKind,
} from "@/server/services/admin/content";
import { createQuestion, importQuestionsCsv, QuestionValidationError, transitionQuestion, updateQuestion } from "@/server/services/admin/questions";
import {
  adminEnroll, createCoupon, grantMembership, grantOrgMembership, reviewFeeAssistance, revokeMembership, setUserRole, setUserStatus, toggleCoupon,
  updatePackage, updatePlan, updateSetting,
} from "@/server/services/admin/users";
import { createMaterial, deleteMaterial, updateMaterial, type UploadedFile } from "@/server/services/admin/materials";
import { directUploadKey, getObject, MAX_MATERIAL_BYTES } from "@/lib/storage";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";

function message(e: unknown): string | null {
  if (e instanceof ZodError) return e.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ");
  if (e instanceof QuestionValidationError || e instanceof AdminInputError || e instanceof AccessError || e instanceof NotFoundError || e instanceof AuthorizationError) return e.message;
  return null;
}

/** Runs an admin mutation, then redirects back with a flash message (works without client JS). */
async function run(perm: Permission, back: string, fn: (actor: { id: string; role: Role }) => Promise<string | void>) {
  const actor = await requireActionPermission(perm);
  let target: string | void;
  try {
    target = await fn(actor);
  } catch (e) {
    const m = message(e);
    if (!m) throw e;
    redirect(`${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent(m.slice(0, 500))}`);
  }
  revalidatePath(back.split("?")[0]);
  const dest = target || back;
  redirect(`${dest}${dest.includes("?") ? "&" : "?"}saved=1`);
}

const s = (f: FormData, k: string) => String(f.get(k) ?? "");
const b = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";
const list = (f: FormData, k: string) => s(f, k).split("\n").map((x) => x.trim()).filter(Boolean);

// ───── Courses ─────
export async function saveCourseAction(id: string | null, f: FormData) {
  await run("content:manage", id ? `/admin/courses/${id}` : "/admin/courses/new", async (a) => {
    const c = await saveCourse(a, id, {
      title: s(f, "title"), subtitle: s(f, "subtitle"), overview: s(f, "overview"), topicId: s(f, "topicId"), level: s(f, "level"), format: s(f, "format"),
      accessTier: s(f, "accessTier"), durationMinutes: s(f, "durationMinutes"), hasCertificate: b(f, "hasCertificate"), passingScore: s(f, "passingScore"),
      maxAttempts: s(f, "maxAttempts"), cpdHours: s(f, "cpdHours"), objectives: list(f, "objectives"), keywords: s(f, "keywords").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
    });
    return `/admin/courses/${c.id}`;
  });
}
export async function courseStatusAction(id: string, status: ContentStatus) {
  await run("content:publish", `/admin/courses/${id}`, async (a) => { await setCourseStatus(a, id, status); });
}
export async function saveModuleAction(courseId: string, id: string | null, f: FormData) {
  await run("content:manage", `/admin/courses/${courseId}`, async (a) => { await saveModule(a, courseId, id, { title: s(f, "title"), summary: s(f, "summary") || null, order: s(f, "order") || 0 }); });
}
export async function deleteModuleAction(courseId: string, id: string) {
  await run("content:manage", `/admin/courses/${courseId}`, async (a) => { await deleteModule(a, id); });
}
export async function saveLessonAction(courseId: string, moduleId: string, id: string | null, f: FormData) {
  await run("content:manage", id ? `/admin/courses/${courseId}/lessons/${id}` : `/admin/courses/${courseId}`, async (a) => {
    const l = await saveLesson(a, moduleId, id, { title: s(f, "title"), type: s(f, "type"), content: s(f, "content"), exercise: s(f, "exercise") || null, videoId: s(f, "videoId") || null, durationMinutes: s(f, "durationMinutes"), order: s(f, "order") || 0 });
    return `/admin/courses/${courseId}/lessons/${l.id}`;
  });
}
export async function deleteLessonAction(courseId: string, id: string) {
  await run("content:manage", `/admin/courses/${courseId}`, async (a) => { await deleteLesson(a, id); return `/admin/courses/${courseId}`; });
}

// ───── Questions ─────
function questionFromForm(f: FormData) {
  const texts = f.getAll("optText").map(String);
  const matches = f.getAll("optMatch").map(String);
  const expl = f.getAll("optExplanation").map(String);
  const correct = new Set(f.getAll("optCorrect").map(String));
  const options = texts.map((text, i) => ({ text: text.trim(), isCorrect: correct.has(String(i)), matchText: matches[i]?.trim() || null, explanation: expl[i]?.trim() || null })).filter((o) => o.text);
  return {
    topicId: s(f, "topicId"), type: s(f, "type"), difficulty: s(f, "difficulty"), stem: s(f, "stem"), scenario: s(f, "scenario") || null, explanation: s(f, "explanation"),
    practicalApplication: s(f, "practicalApplication") || null, sourceReference: s(f, "sourceReference") || null, sourceUrl: s(f, "sourceUrl") || null,
    tags: s(f, "tags").split(",").map((x) => x.trim()).filter(Boolean), accessTier: s(f, "accessTier"), courseId: s(f, "courseId") || null, options,
    acceptedAnswers: s(f, "acceptedAnswers").split("|").map((x) => x.trim()).filter(Boolean), keywords: list(f, "keywords"), modelAnswer: s(f, "modelAnswer") || null,
  };
}
export async function saveQuestionAction(id: string | null, f: FormData) {
  await run("content:manage", id ? `/admin/questions/${id}` : "/admin/questions/new", async (a) => {
    if (id) { await updateQuestion(a, id, questionFromForm(f), s(f, "note") || undefined); return `/admin/questions/${id}`; }
    const q = await createQuestion(a, questionFromForm(f), { allowDuplicate: b(f, "allowDuplicate") });
    return `/admin/questions/${q.id}`;
  });
}
export async function questionStatusAction(id: string, status: ContentStatus) {
  await run(status === "PUBLISHED" ? "content:publish" : "content:manage", `/admin/questions/${id}`, async (a) => { await transitionQuestion(a, id, status); });
}
export async function importQuestionsAction(f: FormData) {
  const file = f.get("file");
  let csv = s(f, "csv");
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) redirect("/admin/questions/import?error=File%20too%20large%20(5%20MB%20max)");
    csv = await file.text();
  }
  await run("content:manage", "/admin/questions/import", async (a) => {
    if (!csv.trim()) throw new AdminInputError("Upload a CSV file or paste CSV content.");
    const r = await importQuestionsCsv(a, csv, { status: b(f, "submitForReview") ? "IN_REVIEW" : "DRAFT" });
    const errs = r.errors.slice(0, 20).map((e) => `Row ${e.row}: ${e.message}`).join(" | ");
    return `/admin/questions/import?created=${r.created}&duplicates=${r.duplicates}&errors=${r.errors.length}${errs ? `&details=${encodeURIComponent(errs.slice(0, 1500))}` : ""}`;
  });
}

// ───── Flashcards ─────
export async function saveDeckAction(id: string | null, f: FormData) {
  await run("content:manage", id ? `/admin/flashcards/${id}` : "/admin/flashcards", async (a) => {
    const d = await saveDeck(a, id, { title: s(f, "title"), description: s(f, "description"), topicId: s(f, "topicId") || null, accessTier: s(f, "accessTier"), status: s(f, "status") });
    return `/admin/flashcards/${d.id}`;
  });
}
export async function saveCardAction(deckId: string, id: string | null, f: FormData) {
  await run("content:manage", `/admin/flashcards/${deckId}`, async (a) => { await saveCard(a, deckId, id, { front: s(f, "front"), back: s(f, "back"), explanation: s(f, "explanation") || null, difficulty: s(f, "difficulty") || "BEGINNER", status: s(f, "status") || "PUBLISHED" }); });
}
export async function deleteCardAction(deckId: string, id: string) {
  await run("content:manage", `/admin/flashcards/${deckId}`, async (a) => { await deleteCard(a, id); });
}

// ───── Videos ─────
export async function saveVideoAction(id: string | null, f: FormData) {
  await run("content:manage", id ? `/admin/videos/${id}` : "/admin/videos", async (a) => {
    const { video } = await saveVideo(a, id, {
      url: s(f, "url"), title: s(f, "title") || null, channelName: s(f, "channelName") || null, channelUrl: s(f, "channelUrl"), description: s(f, "description"),
      durationMinutes: s(f, "durationMinutes"), topicId: s(f, "topicId"), difficulty: s(f, "difficulty"), accessTier: s(f, "accessTier"),
      objectives: list(f, "objectives"), courseId: s(f, "courseId") || null, status: s(f, "status"), manuallyVerified: b(f, "manuallyVerified"),
    });
    return `/admin/videos/${video.id}`;
  });
}
export async function videoAvailabilityAction(id: string, unavailable: boolean) {
  await run("content:manage", `/admin/videos/${id}`, async (a) => { await setVideoUnavailable(a, id, unavailable); });
}
export async function createPlaylistAction(f: FormData) {
  await run("content:manage", "/admin/videos", async (a) => { await savePlaylist(a, { title: s(f, "title"), description: s(f, "description"), videoIds: f.getAll("videoIds").map(String) }); });
}

// ───── Case studies ─────
export async function saveCaseAction(id: string | null, f: FormData) {
  await run("content:manage", id ? `/admin/case-studies/${id}` : "/admin/case-studies/new", async (a) => {
    const keys = ["title", "summary", "category", "topicId", "difficulty", "accessTier", "status", "background", "profile", "transactionDetails", "businessContext", "redFlags", "riskIndicators", "investigationQuestions", "evidenceRequired", "investigationSteps", "possibleFindings", "alternativeExplanations", "riskConsiderations", "conclusion", "references", "followUps", "simulationJson"];
    const c = await saveCaseStudy(a, id, { ...Object.fromEntries(keys.map((k) => [k, s(f, k)])), isFictional: b(f, "isFictional"), featured: b(f, "featured") });
    return `/admin/case-studies/${c.id}`;
  });
}

// ───── Knowledge ─────
export async function saveKnowledgeAction(kind: KnowledgeKind, id: string | null, f: FormData) {
  await run("content:manage", `/admin/content?kind=${kind}${id ? `&id=${id}` : ""}`, async (a) => {
    const raw: Record<string, unknown> = Object.fromEntries([...f.entries()].filter(([k]) => !k.startsWith("$")).map(([k, v]) => [k, String(v)]));
    const saved = await saveKnowledge(a, kind, id, raw);
    return `/admin/content?kind=${kind}&id=${saved.id}`;
  });
}

// ───── Users & memberships ─────
export async function setRoleAction(userId: string, f: FormData) {
  await run("users:manage", `/admin/users/${userId}`, async (a) => { await setUserRole(a, userId, s(f, "role") as Role); });
}
export async function setStatusAction(userId: string, status: "ACTIVE" | "SUSPENDED") {
  await run("users:manage", `/admin/users/${userId}`, async (a) => { await setUserStatus(a, userId, status); });
}
export async function grantMembershipAction(userId: string, f: FormData) {
  await run("memberships:manage", `/admin/users/${userId}`, async (a) => {
    const [kind, slug] = s(f, "product").split(":");
    await grantMembership(a, userId, { kind: kind as "plan" | "package", slug, days: Number(s(f, "days")) || null, source: s(f, "source") === "SCHOLARSHIP" ? "SCHOLARSHIP" : "ADMIN" });
  });
}
export async function revokeMembershipAction(back: string, id: string) {
  await run("memberships:manage", back, async (a) => { await revokeMembership(a, id); });
}
export async function adminEnrollAction(userId: string, f: FormData) {
  await run("users:manage", `/admin/users/${userId}`, async (a) => { await adminEnroll(a, userId, s(f, "courseId")); });
}
export async function grantOrgMembershipAction(f: FormData) {
  await run("memberships:manage", "/admin/memberships", async (a) => { await grantOrgMembership(a, s(f, "orgId"), Number(s(f, "days")) || 365); });
}
export async function updatePlanAction(id: string, f: FormData) {
  await run("packages:manage", "/admin/memberships", async (a) => { await updatePlan(a, id, { priceCents: Math.round(Number(s(f, "price")) * 100), description: s(f, "description"), features: s(f, "features"), isActive: b(f, "isActive"), stripePriceId: s(f, "stripePriceId") || null }); });
}
export async function updatePackageAction(id: string | null, f: FormData) {
  await run("packages:manage", "/admin/memberships", async (a) => {
    await updatePackage(a, id, { name: s(f, "name"), priceCents: Math.round(Number(s(f, "price")) * 100), durationDays: s(f, "durationDays"), description: s(f, "description"), features: s(f, "features"), topicSlugs: f.getAll("topicSlugs").map(String), entitlements: f.getAll("entitlements").map(String), isActive: b(f, "isActive") });
  });
}
export async function createCouponAction(f: FormData) {
  await run("packages:manage", "/admin/memberships", async (a) => { await createCoupon(a, { code: s(f, "code"), description: s(f, "description") || null, percentOff: s(f, "percentOff"), amountOffCents: s(f, "amountOff") ? String(Math.round(Number(s(f, "amountOff")) * 100)) : "", maxRedemptions: s(f, "maxRedemptions"), expiresAt: s(f, "expiresAt") }); });
}
export async function toggleCouponAction(id: string, active: boolean) {
  await run("packages:manage", "/admin/memberships", async (a) => { await toggleCoupon(a, id, active); });
}
export async function reviewAssistanceAction(id: string, f: FormData) {
  await run("memberships:manage", "/admin/memberships", async (a) => { await reviewFeeAssistance(a, id, s(f, "decision") === "APPROVED" ? "APPROVED" : "REJECTED", Number(s(f, "discountPct")) || undefined); });
}
export async function updateFeeSettingAction(f: FormData) {
  await run("packages:manage", "/admin/memberships", async (a) => { await updateSetting(a, "feeAssistance", { enabled: b(f, "enabled"), maxDiscountPct: Math.min(100, Math.max(1, Number(s(f, "maxDiscountPct")) || 50)) }); });
}

// ───── Inquiries & reviews ─────
export async function inquiryStatusAction(id: string, status: "IN_PROGRESS" | "CLOSED") {
  await run("support:manage", "/admin/inquiries", async (a) => { await db.inquiry.update({ where: { id }, data: { status } }); await audit(a.id, "inquiry.status", "Inquiry", id, { status }); });
}
export async function reviewModerationAction(id: string, status: "PUBLISHED" | "ARCHIVED") {
  await run("content:publish", "/admin/courses", async (a) => { await db.courseReview.update({ where: { id }, data: { status } }); await audit(a.id, "review.moderate", "CourseReview", id, { status }); });
}

// ───── Training materials (PDF uploads) ─────
async function pdfFrom(f: FormData): Promise<UploadedFile | null> {
  // Large PDFs on Vercel are uploaded by the browser straight to Blob storage; the form carries its pathname.
  const direct = s(f, "blobPathname");
  if (direct) {
    const key = directUploadKey(direct);
    if (!key) throw new AdminInputError("The uploaded file reference is not valid. Choose the file again.");
    const bytes = await getObject(key).catch(() => { throw new AdminInputError("The uploaded file could not be found. Choose the file again."); });
    return { name: s(f, "blobFilename") || "material.pdf", type: "application/pdf", bytes: new Uint8Array(bytes), storageKey: key };
  }
  const file = f.get("file");
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_MATERIAL_BYTES) throw new AdminInputError("PDF files must be 25 MB or smaller.");
  return { name: file.name, type: file.type, bytes: new Uint8Array(await file.arrayBuffer()) };
}
const materialFrom = (f: FormData) => ({
  title: s(f, "title"), description: s(f, "description"), courseId: s(f, "courseId"), topicId: s(f, "topicId"),
  accessTier: s(f, "accessTier"), isPublished: b(f, "isPublished"),
});
export async function createMaterialAction(f: FormData) {
  const back = f.get("returnTo") === "course" && s(f, "courseId") ? `/admin/materials/new?course=${encodeURIComponent(s(f, "courseId"))}` : "/admin/materials/new";
  await run("content:manage", back, async (a) => {
    const m = await createMaterial(a, materialFrom(f), await pdfFrom(f));
    return `/admin/materials/${m.id}`;
  });
}
export async function updateMaterialAction(id: string, f: FormData) {
  await run("content:manage", `/admin/materials/${id}`, async (a) => { await updateMaterial(a, id, materialFrom(f), await pdfFrom(f)); });
}
export async function deleteMaterialAction(id: string) {
  await run("content:manage", `/admin/materials/${id}`, async (a) => { await deleteMaterial(a, id); return "/admin/materials"; });
}
