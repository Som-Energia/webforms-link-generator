import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./ThemeToggle";
import { initializeTheme, THEME_STORAGE_KEY } from "./theme";

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("theme", () => {
  it("initializes from saved theme before system preference", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));

    initializeTheme();

    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("uses dark system preference when there is no saved theme", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));

    initializeTheme();

    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("toggles the document theme and persists the explicit choice", () => {
    render(<ThemeToggle />);

    const toggle = screen.getByRole("button", { name: "Canvia al tema fosc" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(toggle);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(screen.getByRole("button", { name: "Canvia al tema clar" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("keeps working when localStorage is unavailable", () => {
    const blockedStorage = {
      getItem: vi.fn(() => {
        throw new Error("Storage unavailable");
      }),
      setItem: vi.fn(() => {
        throw new Error("Storage unavailable");
      }),
    };
    vi.stubGlobal("localStorage", blockedStorage);

    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Canvia al tema fosc" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
