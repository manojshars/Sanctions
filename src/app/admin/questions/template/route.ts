import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/rbac";
import { CSV_TEMPLATE } from "@/server/services/admin/questions";

export async function GET() {
  const u = await getCurrentUser();
  if (!u || !can(u.role, "content:manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return new NextResponse(CSV_TEMPLATE, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="question-import-template.csv"' } });
}
