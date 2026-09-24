export const THEME_STORAGE_KEY = "webforms-links-generator-theme";

const DARK_THEME_QUERY = "(prefers-color-scheme: dark)";

function isTheme(value) {
  return value === "light" || value === "dark";
}

function readSavedTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(savedTheme) ? savedTheme : null;
  } catch {
    return null;
  }
}

function readSystemTheme() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia(DARK_THEME_QUERY).matches ? "dark" : "light";
}

export function resolveInitialTheme() {
  return readSavedTheme() ?? readSystemTheme();
}

export function applyTheme(theme) {
  const nextTheme = isTheme(theme) ? theme : "light";

  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = nextTheme;
  }

  return nextTheme;
}

export function saveTheme(theme) {
  if (!isTheme(theme)) {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked in private or embedded contexts; the in-memory theme still works.
  }
}

export function initializeTheme() {
  return applyTheme(resolveInitialTheme());
}
