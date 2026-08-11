import { isTheme, resolveTheme, THEME_STORAGE_KEY, type Theme } from "./theme";

/**
 * The chosen theme, shared by every screen and kept in the device.
 *
 * It lives outside React for the same reason the inline script does: the class
 * on <html> is the source of truth for what is painted, and React only ever
 * catches up with it.
 */
const listeners = new Set<() => void>();
let current: Theme | null = null;

function read(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function paint(theme: Theme): void {
  document.documentElement.classList.toggle(
    "dark",
    resolveTheme(theme, prefersDark()),
  );
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Following the system means following it as it changes, not only on load.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (getSnapshot() === "system") {
      paint("system");
      listener();
    }
  };
  media.addEventListener("change", onSystemChange);

  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onSystemChange);
  };
}

export function getSnapshot(): Theme {
  if (current === null) {
    current = read();
  }
  return current;
}

/** The server has no device to ask; the inline script fixes the class instantly. */
export function getServerSnapshot(): Theme {
  return "system";
}

export function setTheme(theme: Theme): void {
  current = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Nothing to persist to; the choice still applies for this visit.
  }
  paint(theme);
  listeners.forEach((listener) => listener());
}
