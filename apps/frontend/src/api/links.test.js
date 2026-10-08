import { afterEach, describe, expect, it, vi } from "vitest";
import { generateSendSignatureLink, generateSocialTariffLink } from "./links";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generateSocialTariffLink", () => {
  it("sends expiresAt only when an expiry is chosen", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ link: "https://forms.example.test/alta?token=jwt" }),
    });
    vi.stubGlobal("fetch", fetch);

    await generateSocialTariffLink("", "2026-10-15T10:30:00.000Z");
    await generateSocialTariffLink();

    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ expiresAt: "2026-10-15T10:30:00.000Z" });
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({});
  });

  it("rejects when the API returns a non-JSON response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token '<'")),
      }),
    );

    await expect(generateSocialTariffLink()).rejects.toThrow(
      "No s'ha pogut generar l'enllaç. Detalls tècnics: Resposta no JSON (HTTP 502).",
    );
  });

  it("rejects when the network request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(generateSocialTariffLink()).rejects.toThrow(
      "No s'ha pogut generar l'enllaç. Detalls tècnics: Failed to fetch",
    );
  });

  it("redacts credential-like values from network diagnostics", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Request failed: token=secret-token")));

    await expect(generateSocialTariffLink()).rejects.toThrow("token=[redacted]");
    await expect(generateSocialTariffLink()).rejects.not.toThrow("secret-token");
  });

  it("includes a safe API diagnostic without exposing the response body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: vi.fn().mockResolvedValue({
          message: "L'API externa no pot generar el token.",
          detail: "L'API JWT ha retornat HTTP 503.",
          token: "must-not-be-rendered",
        }),
      }),
    );

    await expect(generateSocialTariffLink()).rejects.toThrow(
      "L'API externa no pot generar el token. Detalls tècnics: L'API JWT ha retornat HTTP 503.",
    );
  });

  it("sends a valid custom form URL to the API", async () => {
    const formUrl =
      "https://www.somenergia.coop/es/formulario-contratacion-periodos?form_type=enterprise&uid=3300";
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ link: `${formUrl}&token=jwt-token` }),
    });
    vi.stubGlobal("fetch", fetch);

    await expect(generateSocialTariffLink(formUrl)).resolves.toBe(`${formUrl}&token=jwt-token`);
    expect(fetch).toHaveBeenCalledWith("/api/links/social-tariff", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ formUrl }),
    });
  });

  it("never sends owner to the API", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ link: "https://forms.example.test/alta?token=jwt-token" }),
    });
    vi.stubGlobal("fetch", fetch);

    await expect(generateSocialTariffLink()).resolves.toBe(
      "https://forms.example.test/alta?token=jwt-token",
    );
    expect(fetch).toHaveBeenCalledWith("/api/links/social-tariff", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  });

  it.each([
    ["an HTTP custom form URL", "http://forms.example.test/alta"],
    ["a non-HTTP custom form URL", "ftp://forms.example.test/alta"],
  ])("rejects %s without making a request", async (_scenario, formUrl) => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    await expect(generateSocialTariffLink(formUrl)).rejects.toThrow(
      "L'URL del formulari ha de ser una URL HTTPS vàlida.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("generateSendSignatureLink", () => {
  it("sends a valid custom form URL to the send signature API", async () => {
    const formUrl =
      "https://www.somenergia.coop/es/formulario-contratacion-periodos?form_type=enterprise&uid=3300";
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ link: `${formUrl}&token=jwt-token` }),
    });
    vi.stubGlobal("fetch", fetch);

    await expect(generateSendSignatureLink(formUrl)).resolves.toBe(`${formUrl}&token=jwt-token`);
    expect(fetch).toHaveBeenCalledWith("/api/links/send-signature", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ formUrl }),
    });
  });
});
