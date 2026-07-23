import { NextResponse, type NextRequest } from "next/server";

// Top-level path segments reserved for the app itself. Everything else that's
// a single flat path segment (no further slashes) is treated as a short-link key,
// since this deployment has no separate link domain — links live on this same host.
const RESERVED_SEGMENTS = new Set(["login", "register", "onboarding", "expired", "invite", "verify"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.replace(/^\/+|\/+$/g, "").split("/");

  const isShortLinkPath = segments.length === 1 && segments[0] !== "" && !RESERVED_SEGMENTS.has(segments[0]);
  if (!isShortLinkPath) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/api/redirect";

  const headers = new Headers(request.headers);
  headers.set("x-sglink-key", segments[0]);

  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico).*)"],
};
