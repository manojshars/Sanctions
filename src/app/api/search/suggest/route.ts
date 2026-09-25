import { NextResponse } from "next/server";
import { suggest } from "@/server/services/search";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!rateLimit(`suggest:${ip}`, 120, 60_000).ok) return NextResponse.json({ items: [] }, { status: 429 });
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return NextResponse.json({ items: await suggest(q) }, { headers: { "Cache-Control": "public, max-age=60" } });
}
