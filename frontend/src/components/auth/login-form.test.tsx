import { ApiError } from "@/lib/api/http";
import { loginErrorMessage } from "./login-form";

describe("loginErrorMessage", () => {
  it("says the credentials are wrong on a 401, not that the session expired", () => {
    expect(loginErrorMessage(new ApiError(401, "Invalid credentials"))?.message).toBe(
      "Email o contraseña incorrectos.",
    );
  });

  it("asks to wait when the login is rate limited", () => {
    expect(loginErrorMessage(new ApiError(429, "Too many"))?.message).toMatch(
      /Demasiados intentos/,
    );
  });

  it("keeps any other error as it is", () => {
    const error = new ApiError(500, "Algo ha fallado");
    expect(loginErrorMessage(error)).toBe(error);
  });

  it("renders nothing without an error", () => {
    expect(loginErrorMessage(null)).toBeNull();
  });
});
