import { isTheme, resolveTheme, THEME_SCRIPT } from "./theme";

describe("resolving the theme", () => {
  it("obeys an explicit choice whatever the system says", () => {
    expect(resolveTheme("dark", false)).toBe(true);
    expect(resolveTheme("light", true)).toBe(false);
  });

  it("follows the system when nothing was chosen", () => {
    expect(resolveTheme("system", true)).toBe(true);
    expect(resolveTheme("system", false)).toBe(false);
  });
});

describe("reading a stored preference", () => {
  it("accepts only the three it knows", () => {
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(true);
    expect(isTheme("solarized")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
});

describe("the inline script", () => {
  it("still follows the system when storage is unavailable", () => {
    const classList = { add: jest.fn() };
    const fakeWindow = {
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
      },
      matchMedia: () => ({ matches: true }),
      document: { documentElement: { classList } },
    };

    // The script talks to the page directly, so it is run against a fake one.
    new Function("window", "localStorage", "document", THEME_SCRIPT)(
      fakeWindow,
      fakeWindow.localStorage,
      fakeWindow.document,
    );

    expect(classList.add).toHaveBeenCalledWith("dark");
  });
});
