import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntitlements, hasFeature } from "@/lib/entitlements";
import { courseAccess } from "@/server/services/courses";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; resourceId: string }> }) {
  const { slug, resourceId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const resource = await db.courseResource.findUnique({ where: { id: resourceId }, include: { course: { include: { topic: true } } } });
  if (!resource || resource.course.slug !== slug) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const enrolled = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: resource.courseId } } });
  const ent = await getEntitlements(user);
  const allowed = enrolled && (await courseAccess(user, resource.course, ent)) && (resource.accessTier === "FREE" || hasFeature(ent, "DOWNLOADS", resource.course.topic.slug) || ent.courseIds.has(resource.courseId));
  if (!allowed) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  return new NextResponse(resource.content, {
    headers: {
      "Content-Type": `${resource.mimeType}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${resource.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
