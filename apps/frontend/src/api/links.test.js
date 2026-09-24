import { afterEach, describe, expect, it, vi } from "vitest";
import { generateSocialTariffLink } from "./links";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generateSocialTariffLink", () => {
  it("rejects when the API returns a non-JSON response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token '<'")),
      }),
    );

    await expect(generateSocialTariffLink()).rejects.toThrow("Unexpected token '<'");
  });

  it("rejects when the network request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(generateSocialTariffLink()).rejects.toThrow("Failed to fetch");
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

  it("rejects an invalid custom form URL without making a request", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    await expect(generateSocialTariffLink("ftp://forms.example.test/alta")).rejects.toThrow(
      "L'URL del formulari ha de ser una URL HTTP o HTTPS vàlida.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
