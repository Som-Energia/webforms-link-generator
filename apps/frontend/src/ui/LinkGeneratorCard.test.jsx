import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
          expiryOptions={["7days"]}
        />
      </StrictMode>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Genera l'enllaç" }));
    expect(screen.getByRole("button", { name: "S'està generant..." }).disabled).toBe(true);

    resolveLink("https://example.test/generated-link");

    const generatedUrl = "https://example.test/generated-link";
    await waitFor(() => {
      expect(screen.getByRole("link", { name: generatedUrl })).not.toBeNull();
    });
    const generatedLink = screen.getByRole("link", { name: generatedUrl });
    expect(generatedLink.getAttribute("href")).toBe(generatedUrl);
    expect(generatedLink.getAttribute("target")).toBe("_blank");
    expect(generatedLink.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByRole("button", { name: "Genera l'enllaç" }).disabled).toBe(false);
    expect(screen.getByText("L'enllaç caduca en 7 dies 00 h 00 min 00 s.")).not.toBeNull();
  });

  it("copies the generated link with the icon-only copy button", async () => {
    const generatedUrl = "https://example.test/generated-link";
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <LinkGeneratorCard
        title="Tarifa social"
        description="Genera un enllaç."
        generateLink={vi.fn().mockResolvedValue(generatedUrl)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Genera l'enllaç" }));
    await screen.findByRole("link", { name: generatedUrl });
    fireEvent.click(screen.getByRole("button", { name: "Copia l'enllaç" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(generatedUrl);
    });
    expect(screen.getByText("Copiat").getAttribute("role")).toBe("status");
  });

  it("renders an unsafe API response URL as text rather than an actionable link", async () => {
    const generatedUrl = "javascript:alert('unsafe')";

    render(
      <LinkGeneratorCard
        title="Tarifa social"
        description="Genera un enllaç."
        generateLink={vi.fn().mockResolvedValue(generatedUrl)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Genera l'enllaç" }));

    expect(await screen.findByText(generatedUrl)).not.toBeNull();
    expect(screen.queryByRole("link", { name: generatedUrl })).toBeNull();
  });

  it.each([
    new Error("No s'ha pogut generar l'enllaç. Detalls tècnics: Resposta no JSON (HTTP 502)."),
    new Error("No s'ha pogut generar l'enllaç. Detalls tècnics: Failed to fetch"),
  ])(
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

  it("lets the user pick one expiry option and sends its exact expiry date", async () => {
    const generateLink = vi.fn().mockResolvedValue("https://example.test/generated-link");
    render(
      <LinkGeneratorCard
        title="Tarifa social"
        description="Genera un enllaç."
        generateLink={generateLink}
        expiryOptions={["30min", "60min", "7days"]}
      />,
    );

    const group = screen.getByRole("radiogroup", { name: "Caducitat de l'enllaç" });
    const options = within(group).getAllByRole("radio");
    expect(options.map((option) => option.checked)).toEqual([true, false, false]);
    expect(screen.getByText("L'enllaç generat caduca al cap de 30 minuts.")).not.toBeNull();

    fireEvent.click(within(group).getByRole("radio", { name: "7 dies" }));

    expect(options.map((option) => option.checked)).toEqual([false, false, true]);
    expect(screen.getByText("L'enllaç generat caduca al cap de 7 dies.")).not.toBeNull();

    const requestedAt = Date.now();
    fireEvent.click(screen.getByRole("button", { name: "Genera l'enllaç" }));

    await screen.findByRole("link", { name: "https://example.test/generated-link" });
    const sentExpiresAt = Date.parse(generateLink.mock.calls[0][0]);
    expect(sentExpiresAt - requestedAt).toBeGreaterThanOrEqual(10080 * 60 * 1000);
    expect(sentExpiresAt - requestedAt).toBeLessThan(10080 * 60 * 1000 + 1000);
    expect(screen.getByText("L'enllaç caduca en 7 dies 00 h 00 min 00 s.")).not.toBeNull();
  });

  it.each([
    [undefined, "30 minuts", undefined],
    [[], "30 minuts", undefined],
    [["60min"], "1 hora", 60],
  ])("hides the selector for options %j and uses %s", async (expiryOptions, label, expectedMinutes) => {
    const generateLink = vi.fn().mockResolvedValue("https://example.test/generated-link");
    render(
      <LinkGeneratorCard
        title="Tarifa social"
        description="Genera un enllaç."
        generateLink={generateLink}
        expiryOptions={expiryOptions}
      />,
    );

    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.getByText(`L'enllaç generat caduca al cap de ${label}.`)).not.toBeNull();

    const requestedAt = Date.now();
    fireEvent.click(screen.getByRole("button", { name: "Genera l'enllaç" }));
    await screen.findByRole("link", { name: "https://example.test/generated-link" });

    const [sentExpiresAt] = generateLink.mock.calls[0];
    if (expectedMinutes === undefined) {
      expect(sentExpiresAt).toBeUndefined();
    } else {
      const delta = Date.parse(sentExpiresAt) - requestedAt;
      expect(delta).toBeGreaterThanOrEqual(expectedMinutes * 60 * 1000);
      expect(delta).toBeLessThan(expectedMinutes * 60 * 1000 + 1000);
    }
  });
});
