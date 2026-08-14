import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "josema_session";
const LOGIN_PATH = "/login";
/** The client portal: opened by a token in the URL, never by a trainer session. */
const PORTAL_PREFIX = "/p/";

/**
 * Backend origin, read on every request. It must NOT be resolved in `next.config.ts`:
 * rewrites there are evaluated at build time and would bake the build machine's value
 * into the image (and `output: standalone` ships that frozen manifest).
 */
function backendUrl(): string {
  return process.env.BACKEND_URL ?? "http://localhost:8001";
}

/** Same-origin proxy: the browser only talks to this app, so the session cookie needs no CORS. */
function proxyToBackend(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  return NextResponse.rewrite(new URL(`${pathname}${search}`, backendUrl()));
}

/**
 * Optimistic auth guard: only checks that a session cookie exists so unauthenticated
 * visitors never see the dashboard shell. Every API call is still authorized by the
 * backend, which validates the JWT.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/") || pathname.startsWith("/static/")) {
    return proxyToBackend(request);
  }

  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isLoginRoute = pathname === LOGIN_PATH;
  const isPortalRoute = pathname.startsWith(PORTAL_PREFIX);

  if (isPortalRoute) {
    return NextResponse.next();
  }

  if (!hasSession && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    if (pathname !== "/") {
      url.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(url);
  }

  if (hasSession && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next.js internals: /api and /static are proxied above.
  // The PWA pieces are listed too — the worker, its manifest, the icons and the
  // offline page are fetched with no session at all, and a redirect to /login
  // would make the app uninstallable for the client. `brand/` is here for the
  // same reason: the logo is on the login screen and in the client portal,
  // where there is no session to redirect with.
  matcher: [
    "/((?!_next/|favicon.ico|icons/|brand/|sw.js|manifest.webmanifest|offline).*)",
  ],
};
