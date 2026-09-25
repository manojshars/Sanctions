import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware: fast redirect for signed-out users on private routes and noindex headers.
 * It only checks for the presence of the session cookie; every page and action re-validates the
 * session and permissions on the server (defence in depth).
 */
const PROTECTED = ["/dashboard", "/my-learning", "/profile", "/settings", "/notifications", "/admin", "/corporate/dashboard", "/support/tickets", "/support/new", "/flashcards/review", "/checkout"];
const NOINDEX = [...PROTECTED, "/question-bank/session", "/mock-exams/exam", "/certificates", "/api", "/search"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasSession = !!req.cookies.get("fca_session")?.value;
  if (!hasSession && PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  if (NOINDEX.some((p) => pathname === p || pathname.startsWith(p + "/")) && !pathname.startsWith("/certificates/verify")) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|sitemap.xml|robots.txt).*)"] };
