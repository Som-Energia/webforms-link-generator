import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatCountdown, formatExpiryDuration, LinkGeneratorCard } from "./LinkGeneratorCard";

afterEach(cleanup);

describe("LinkGeneratorCard", () => {
  it.each([
    [30, "30 minuts"],
    [61, "1 hora i 1 minut"],
    [10080, "7 dies"],
  ])("formats a static expiry of %i minutes as %s", (expiryMinutes, expected) => {
    expect(formatExpiryDuration(expiryMinutes)).toBe(expected);
  });

  it.each([
    [30 * 60, "30:00"],
    [90 * 60, "1 h 30 min 00 s"],
    [10080 * 60, "7 dies 00 h 00 min 00 s"],
  ])("formats %i remaining seconds as %s", (remainingSeconds, expected) => {
    expect(formatCountdown(remainingSeconds)).toBe(expected);
  });

  it("clears loading and starts a 10080-minute countdown after a successful generation in StrictMode", async () => {
    let resolveLink;
    const generateLink = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveLink = resolve;
        }),
    );

    render(
      <StrictMode>
        <LinkGeneratorCard
          title="Tarifa social"
          description="Genera un enllaç."
          generateLink={generateLink}
          expiryMinutes={10080}
        />
      </StrictMode>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Genera l'enllaç" }));
    expect(screen.getByRole("button", { name: "S'està generant..." }).disabled).toBe(true);

    resolveLink("https://example.test/generated-link");

    await waitFor(() => {
      expect(screen.getByDisplayValue("https://example.test/generated-link")).not.toBeNull();
    });
    expect(screen.getByRole("button", { name: "Genera l'enllaç" }).disabled).toBe(false);
    expect(screen.getByText("L'enllaç caduca en 7 dies 00 h 00 min 00 s.")).not.toBeNull();
  });

  it.each([new SyntaxError("Unexpected token '<'"), new TypeError("Failed to fetch")])(
    "clears loading after an API failure",
    async (failure) => {
      render(
        <LinkGeneratorCard
          title="Tarifa social"
          description="Genera un enllaç."
          generateLink={vi.fn().mockRejectedValue(failure)}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Genera l'enllaç" }));

      await waitFor(() => {
        expect(screen.getByText(failure.message)).not.toBeNull();
      });
      expect(screen.getByRole("button", { name: "Genera l'enllaç" }).disabled).toBe(false);
    },
  );
});
