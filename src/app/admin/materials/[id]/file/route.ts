import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { fileResponseHeaders, readResourceFile } from "@/server/services/resources";

/** Staff preview of any material, including unpublished drafts. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "content:manage")) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  const { id } = await params;
  const r = await db.courseResource.findUnique({ where: { id } });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const f = await readResourceFile(r);
  return new NextResponse(new Uint8Array(f.body), { headers: fileResponseHeaders(f) });
}
