export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "josema:theme";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

/** Whether the page should be painted dark, once the system is taken into account. */
export function resolveTheme(theme: Theme, prefersDark: boolean): boolean {
  return theme === "dark" || (theme === "system" && prefersDark);
}

/**
 * Runs inline in <head>, before the browser paints anything: any later and the
 * trainer sees a white flash on every load. Kept as a string because it has to
 * ship without React, without bundling and without waiting for hydration.
 */
export const THEME_SCRIPT = `
(function () {
  var theme = "system";
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    if (stored === "light" || stored === "dark") { theme = stored; }
  } catch (error) {
    // Storage blocked (private mode): fall back to what the system asks for.
  }
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (theme === "dark" || (theme === "system" && prefersDark)) {
    document.documentElement.classList.add("dark");
  }
})();
`;
