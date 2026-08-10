/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { proxy } from "./proxy";

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
