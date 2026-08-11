/**
 * @jest-environment node
 */
import { GET } from "./route";

function manifestFor(token: string) {
  return GET(
    new Request(`http://localhost:3000/p/${token}/manifest.webmanifest`),
    { params: Promise.resolve({ token }) },
  );
}

describe("client portal manifest", () => {
  it("starts the installed app on the client's own link", async () => {
    const manifest = await (await manifestFor("abc123")).json();

    expect(manifest.start_url).toBe("/p/abc123");
    expect(manifest.scope).toBe("/p/abc123");
    // A distinct id per token, or one client's install would replace another's.
    expect(manifest.id).toBe("/p/abc123");
  });

  it("is served as a manifest and kept out of shared caches", async () => {
    const response = await manifestFor("abc123");

    expect(response.headers.get("Content-Type")).toContain(
      "application/manifest+json",
    );
    expect(response.headers.get("Cache-Control")).toContain("private");
  });

  it("escapes a token that would break out of the URL", async () => {
    const manifest = await (await manifestFor("a/../b")).json();

    expect(manifest.start_url).toBe("/p/a%2F..%2Fb");
  });
});
