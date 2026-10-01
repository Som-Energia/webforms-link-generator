import { afterEach, describe, expect, it, vi } from "vitest";
import { generateSendSignatureLink, generateSocialTariffLink } from "./links";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generateSocialTariffLink", () => {
  it("rejects when the API returns a non-JSON response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token '<'")),
      }),
    );

    await expect(generateSocialTariffLink("ada-lovelace")).rejects.toThrow(
      "No s'ha pogut generar l'enllaç. Detalls tècnics: Resposta no JSON (HTTP 502).",
    );
  });

  it("rejects when the network request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(generateSocialTariffLink("ada-lovelace")).rejects.toThrow(
      "No s'ha pogut generar l'enllaç. Detalls tècnics: Failed to fetch",
    );
  });

  it("redacts credential-like values from network diagnostics", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Request failed: token=secret-token")));

    await expect(generateSocialTariffLink("ada-lovelace")).rejects.toThrow("token=[redacted]");
    await expect(generateSocialTariffLink("ada-lovelace")).rejects.not.toThrow("secret-token");
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

    await expect(generateSocialTariffLink("ada-lovelace")).rejects.toThrow(
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

    await expect(generateSocialTariffLink("ada-lovelace", formUrl)).resolves.toBe(`${formUrl}&token=jwt-token`);
    expect(fetch).toHaveBeenCalledWith("/api/links/social-tariff", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ owner: "ada-lovelace", formUrl }),
    });
  });

  it("omits owner from the API request when it is disabled", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ link: "https://forms.example.test/alta?token=jwt-token" }),
    });
    vi.stubGlobal("fetch", fetch);

    await expect(generateSocialTariffLink(undefined)).resolves.toBe(
      "https://forms.example.test/alta?token=jwt-token",
    );
    expect(fetch).toHaveBeenCalledWith("/api/links/social-tariff", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  });

  it("rejects an invalid custom form URL without making a request", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    await expect(generateSocialTariffLink("ada-lovelace", "ftp://forms.example.test/alta")).rejects.toThrow(
      "L'URL del formulari ha de ser una URL HTTP o HTTPS vàlida.",
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

    await expect(generateSendSignatureLink("ada-lovelace", formUrl)).resolves.toBe(`${formUrl}&token=jwt-token`);
    expect(fetch).toHaveBeenCalledWith("/api/links/send-signature", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ owner: "ada-lovelace", formUrl }),
    });
  });
});
