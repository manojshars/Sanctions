import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { AccessError, NotFoundError } from "@/server/services/courses";
import { downloadResource, fileResponseHeaders } from "@/server/services/resources";

/** Download for any published material (course or standalone library item). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/resources")}`, req.url));
  try {
    const f = await downloadResource(user, id);
    return new NextResponse(new Uint8Array(f.body), { headers: fileResponseHeaders(f) });
  } catch (e) {
    if (e instanceof NotFoundError) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (e instanceof AccessError) return NextResponse.redirect(new URL("/pricing", req.url), 303);
    throw e;
  }
}
