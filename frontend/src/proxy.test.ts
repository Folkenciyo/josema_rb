/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { config, proxy } from "./proxy";

const SESSION_COOKIE = "josema_session";

function requestFor(path: string, { signedIn = false } = {}): NextRequest {
  const request = new NextRequest(new URL(`http://localhost:3000${path}`));
  if (signedIn) {
    request.cookies.set(SESSION_COOKIE, "token");
  }
  return request;
}

describe("proxy", () => {
  it("lets the client portal through without a session", () => {
    const response = proxy(requestFor("/p/some-token"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("still sends the rest of the app to the login screen", () => {
    const response = proxy(requestFor("/clients"));

    expect(response.headers.get("location")).toContain("/login");
  });

  it("keeps the portal open for a signed-in trainer too", () => {
    const response = proxy(requestFor("/p/some-token", { signedIn: true }));

    expect(response.headers.get("location")).toBeNull();
  });
});

describe("proxy matcher", () => {
  const matches = (path: string) =>
    new RegExp(`^${config.matcher[0]}$`).test(path);

  it.each([
    "/sw.js",
    "/manifest.webmanifest",
    "/icons/icon-192.png",
    "/offline",
  ])("never runs for %s, which is fetched with no session", (path) => {
    expect(matches(path)).toBe(false);
  });

  it("still runs for the rest of the app", () => {
    expect(matches("/clients")).toBe(true);
    // The per-client manifest is a portal route and goes through the guard above.
    expect(matches("/p/some-token/manifest.webmanifest")).toBe(true);
  });
});
