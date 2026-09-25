import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getObject } from "@/lib/storage";
import { isSupportStaff } from "@/server/services/support";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const att = await db.supportAttachment.findUnique({ where: { id }, include: { message: { include: { ticket: true } } } });
  const staff = isSupportStaff(user.role);
  if (!att || (!staff && (att.message.ticket.userId !== user.id || att.message.isInternal))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await getObject(att.storageKey);
  return new NextResponse(new Uint8Array(body), {
    headers: { "Content-Type": att.mimeType, "Content-Disposition": `attachment; filename="${att.filename}"`, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" },
  });
}
