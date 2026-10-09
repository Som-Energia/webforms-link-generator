import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyButton, COPY_FEEDBACK_DELAY } from "./CopyButton";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CopyButton", () => {
  it("shows and clears the floating success tooltip without changing the button label", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyButton label="Copia l'enllaç" value="https://example.test/link" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copia l'enllaç" }));
    });

    expect(writeText).toHaveBeenCalledWith("https://example.test/link");
    expect(screen.getByRole("status").textContent).toBe("Copiat");
    expect(screen.getByRole("button", { name: "Copia l'enllaç" })).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(COPY_FEEDBACK_DELAY);
    });

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps only the latest result when copy is clicked repeatedly", async () => {
    let resolveFirstCopy;
    const writeText = vi
      .fn()
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveFirstCopy = resolve;
      }))
      .mockRejectedValueOnce(new Error("Permission denied"));
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyButton label="Copia l'enllaç" value="https://example.test/link" />);
    const button = screen.getByRole("button", { name: "Copia l'enllaç" });

    fireEvent.click(button);
    fireEvent.click(button);

    await act(async () => {});
    expect(screen.getByRole("status").textContent).toBe("No s'ha pogut copiar. Torna-ho a provar.");

    await act(async () => {
      resolveFirstCopy();
    });
    expect(screen.getByRole("status").textContent).toBe("No s'ha pogut copiar. Torna-ho a provar.");
  });

  it("clears its pending feedback timer when unmounted", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { unmount } = render(<CopyButton label="Copia l'enllaç" value="https://example.test/link" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copia l'enllaç" }));
    });
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
