import { isExpiredSession, loginPathAfterExpiry } from "./expired-session";
import { ApiError } from "@/lib/api/http";

describe("spotting an expired session", () => {
  it("recognises a 401 from anywhere in the trainer's app", () => {
    expect(isExpiredSession(new ApiError(401, "nope"), "/clients")).toBe(true);
  });

  it("ignores every other failure", () => {
    expect(isExpiredSession(new ApiError(404, "nope"), "/clients")).toBe(false);
    expect(isExpiredSession(new Error("network"), "/clients")).toBe(false);
  });

  it("does not sign out from the login screen itself", () => {
    expect(isExpiredSession(new ApiError(401, "nope"), "/login")).toBe(false);
  });

  it("leaves the client portal alone, which never had a session", () => {
    expect(isExpiredSession(new ApiError(401, "nope"), "/p/token/peso")).toBe(
      false,
    );
  });
});

describe("where the trainer lands", () => {
  it("says the session expired and remembers the screen they were on", () => {
    const destination = loginPathAfterExpiry("/clients/abc", "?tab=plans");

    expect(destination).toBe(
      "/login?expired=1&next=%2Fclients%2Fabc%3Ftab%3Dplans",
    );
  });

  it("does not bother remembering the home page", () => {
    expect(loginPathAfterExpiry("/", "")).toBe("/login?expired=1");
  });
});
