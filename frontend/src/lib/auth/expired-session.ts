import { ApiError } from "@/lib/api/http";

export const LOGIN_PATH = "/login";
/** The client portal is opened by a token and has no session to expire. */
const PORTAL_PREFIX = "/p/";

/**
 * A 401 anywhere in the trainer's app means the session is gone, whatever the
 * browser still has in its cookie jar.
 */
export function isExpiredSession(error: unknown, pathname: string): boolean {
  return (
    error instanceof ApiError &&
    error.isUnauthorized &&
    pathname !== LOGIN_PATH &&
    !pathname.startsWith(PORTAL_PREFIX)
  );
}

export function loginPathAfterExpiry(pathname: string, search: string): string {
  // Where they were, so signing in again lands them back on the same screen.
  const params = new URLSearchParams({ expired: "1" });
  if (pathname !== "/" && !pathname.startsWith(PORTAL_PREFIX)) {
    params.set("next", `${pathname}${search}`);
  }
  return `${LOGIN_PATH}?${params.toString()}`;
}
