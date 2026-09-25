import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { orgReport, reportToCsv } from "@/server/services/corporate";
import { AccessError } from "@/server/services/courses";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const orgId = new URL(req.url).searchParams.get("org") ?? "";
  try {
    const r = await orgReport(user.id, orgId);
    return new NextResponse(reportToCsv(r.rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${r.org.slug}-completion-report.csv"`, "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof AccessError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }
}
