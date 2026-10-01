import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  generateSendSignatureLink,
  generateSocialTariffLink,
} from "../api/links";
import { version } from "../../package.json";
import { AdminPage, DEFAULT_FORM_URL } from "./AdminPage";
import { OWNER_NAME_STORAGE_KEY } from "../owner/owner";

vi.mock("../api/links", () => ({
  generateSendSignatureLink: vi.fn(),
  generateSocialTariffLink: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe("AdminPage", () => {
  it("displays the frontend version", () => {
    window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, "Ada Lovelace");
    render(<AdminPage />);

    expect(screen.getByText(`v${version}`).tagName).toBe("DATA");
  });

  it("displays a personal link using the default form URL", () => {
    window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, "Ada Lovelace");
    render(<AdminPage />);

    const personalUrl = `${DEFAULT_FORM_URL}&owner=ada-lovelace`;
    const personalLink = screen.getByRole("link", { name: personalUrl });
    expect(personalLink.getAttribute("href")).toBe(personalUrl);
    expect(personalLink.getAttribute("target")).toBe("_blank");
    expect(personalLink.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("positions the owner toggle beside the form URL input", () => {
    window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, "Ada Lovelace");
    render(<AdminPage />);

    const formUrl = screen.getByLabelText("URL del formulari de destí (opcional)");
    const ownerToggle = screen.getByLabelText("Afegir el meu usuari");

    expect(formUrl.parentElement?.className).toBe("form-url-input-row");
    expect(ownerToggle.closest("label")?.parentElement).toBe(formUrl.parentElement);
  });

  it("hides the personal link and omits owner when the toggle is disabled", async () => {
    window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, "Ada Lovelace");
    generateSocialTariffLink.mockResolvedValue("https://forms.example.test/alta?token=jwt-token");
    render(<AdminPage />);

    fireEvent.click(screen.getByLabelText("Afegir el meu usuari"));

    expect(screen.queryByRole("link", { name: `${DEFAULT_FORM_URL}&owner=ada-lovelace` })).toBeNull();
    expect(document.querySelector(".personal-link-section")?.textContent).toBe("");
    const socialTariffCard = screen
      .getByRole("heading", { name: "Tarifa social" })
      .closest("article");
    fireEvent.click(within(socialTariffCard).getByRole("button", { name: "Genera l'enllaç" }));

    await waitFor(() => {
      expect(generateSocialTariffLink).toHaveBeenCalledWith(undefined, "");
    });
  });

  it("updates every displayed generated link when the owner toggle changes", async () => {
    window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, "Ada Lovelace");
    const socialTariffUrl =
      "https://forms.example.test/alta?token=social-token&owner=old-owner&owner=duplicate&uid=3300#step-2";
    const sendSignatureUrl =
      "https://forms.example.test/signatura?owner=old-owner&token=signature-token&source=email#final";
    generateSocialTariffLink.mockResolvedValue(socialTariffUrl);
    generateSendSignatureLink.mockResolvedValue(sendSignatureUrl);
    render(<AdminPage />);

    const socialTariffCard = screen
      .getByRole("heading", { name: "Tarifa social" })
      .closest("article");
    const sendSignatureCard = screen
      .getByRole("heading", { name: "Enviament de signatura" })
      .closest("article");
    fireEvent.click(within(socialTariffCard).getByRole("button", { name: "Genera l'enllaç" }));
    fireEvent.click(within(sendSignatureCard).getByRole("button", { name: "Genera l'enllaç" }));

    await screen.findByRole("link", { name: socialTariffUrl });
    await screen.findByRole("link", { name: sendSignatureUrl });
    fireEvent.click(screen.getByLabelText("Afegir el meu usuari"));

    const socialTariffWithoutOwner =
      "https://forms.example.test/alta?token=social-token&uid=3300#step-2";
    const sendSignatureWithoutOwner =
      "https://forms.example.test/signatura?token=signature-token&source=email#final";
    await screen.findByRole("link", { name: socialTariffWithoutOwner });
    await screen.findByRole("link", { name: sendSignatureWithoutOwner });

    fireEvent.click(screen.getByLabelText("Afegir el meu usuari"));

    expect(
      await screen.findByRole("link", {
        name: "https://forms.example.test/alta?token=social-token&uid=3300&owner=ada-lovelace#step-2",
      }),
    ).not.toBeNull();
    expect(
      await screen.findByRole("link", {
        name: "https://forms.example.test/signatura?token=signature-token&source=email&owner=ada-lovelace#final",
      }),
    ).not.toBeNull();
  });

  it("replaces owner while preserving custom query parameters and fragments", () => {
    window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, "Ada Lovelace");
    render(<AdminPage />);

    fireEvent.change(screen.getByLabelText("URL del formulari de destí (opcional)"), {
      target: {
        value:
          "https://forms.example.test/contractacio?form_type=enterprise&owner=old-owner&uid=3300#step-2",
      },
    });

    expect(
      screen.getByRole("link", {
        name: "https://forms.example.test/contractacio?form_type=enterprise&owner=ada-lovelace&uid=3300#step-2",
      }),
    ).not.toBeNull();
  });

  it("updates the personal link when the owner is changed", () => {
    window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, "Ada Lovelace");
    render(<AdminPage />);

    fireEvent.click(screen.getByRole("button", { name: "Obre el menú de perfil" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Introdueix el teu nom complet"), {
      target: { value: "Grace Hopper" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Desa el nom" }));

    expect(screen.getByRole("link", { name: `${DEFAULT_FORM_URL}&owner=grace-hopper` })).not.toBeNull();
  });

  it("copies the personal link and confirms success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, "Ada Lovelace");
    render(<AdminPage />);

    fireEvent.click(screen.getByRole("button", { name: "Copia l'enllaç personal" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`${DEFAULT_FORM_URL}&owner=ada-lovelace`);
    });
    expect(screen.getByText("Copiat").getAttribute("role")).toBe("status");
  });

  it("reports a failed personal link copy", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Permission denied"));
    Object.assign(navigator, { clipboard: { writeText } });
    window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, "Ada Lovelace");
    render(<AdminPage />);

    fireEvent.click(screen.getByRole("button", { name: "Copia l'enllaç personal" }));

    expect(
      await screen.findByText("No s'ha pogut copiar. Torna-ho a provar."),
    ).not.toBeNull();
    expect(screen.getByText("No s'ha pogut copiar. Torna-ho a provar.").getAttribute("role")).toBe("status");
  });

  it("passes the populated custom form URL to the link generator", async () => {
    const formUrl =
      "https://www.somenergia.coop/es/formulario-contratacion-periodos?form_type=enterprise&uid=3300";
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, "Ada Lovelace");
    generateSocialTariffLink.mockResolvedValue(`${formUrl}&token=jwt-token`);

    render(<AdminPage />);

    const socialTariffCard = screen
      .getByRole("heading", { name: "Tarifa social" })
      .closest("article");
    expect(socialTariffCard).not.toBeNull();
    expect(
      within(socialTariffCard).getByText(
        "L'enllaç generat caduca al cap de 30 minuts.",
      ),
    ).not.toBeNull();

    fireEvent.change(
      screen.getByLabelText("URL del formulari de destí (opcional)"),
      {
        target: { value: formUrl },
      },
    );
    fireEvent.click(
      within(socialTariffCard).getByRole("button", { name: "Genera l'enllaç" }),
    );

    await waitFor(() => {
      expect(generateSocialTariffLink).toHaveBeenCalledWith("ada-lovelace", formUrl);
    });
    const generatedUrl = `${formUrl}&token=jwt-token`;
    const generatedLink = within(socialTariffCard).getByRole("link", { name: generatedUrl });
    expect(generatedLink.getAttribute("href")).toBe(generatedUrl);
    expect(generatedLink.getAttribute("target")).toBe("_blank");
    expect(generatedLink.getAttribute("rel")).toBe("noopener noreferrer");
    fireEvent.click(within(socialTariffCard).getByRole("button", { name: "Copia l'enllaç" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(generatedUrl);
    });
  });

  it("renders the send signature generator and passes the custom form URL", async () => {
    const formUrl =
      "https://www.somenergia.coop/es/formulario-contratacion-periodos?form_type=enterprise&uid=3300";
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, "Ada Lovelace");
    generateSendSignatureLink.mockResolvedValue(`${formUrl}&token=jwt-token`);

    render(<AdminPage />);

    const sendSignatureCard = screen
      .getByRole("heading", { name: "Enviament de signatura" })
      .closest("article");
    expect(sendSignatureCard).not.toBeNull();
    expect(within(sendSignatureCard).getByText(/sendSignature/)).not.toBeNull();

    fireEvent.change(
      screen.getByLabelText("URL del formulari de destí (opcional)"),
      {
        target: { value: formUrl },
      },
    );
    fireEvent.click(
      within(sendSignatureCard).getByRole("button", {
        name: "Genera l'enllaç",
      }),
    );

    await waitFor(() => {
      expect(generateSendSignatureLink).toHaveBeenCalledWith("ada-lovelace", formUrl);
    });
    const generatedUrl = `${formUrl}&token=jwt-token`;
    const generatedLink = within(sendSignatureCard).getByRole("link", { name: generatedUrl });
    expect(generatedLink.getAttribute("href")).toBe(generatedUrl);
    expect(generatedLink.getAttribute("target")).toBe("_blank");
    expect(generatedLink.getAttribute("rel")).toBe("noopener noreferrer");
    fireEvent.click(within(sendSignatureCard).getByRole("button", { name: "Copia l'enllaç" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(generatedUrl);
    });
  });

  it("requires an owner name on first visit and persists a valid name", () => {
    render(<AdminPage />);

    expect(screen.getByRole("dialog", { name: "Identifica el teu enllaç" })).not.toBeNull();
    expect(screen.getByText("La forma normalitzada del teu nom complet identificarà cada enllaç generat.")).not.toBeNull();
    fireEvent.change(screen.getByLabelText("Introdueix el teu nom complet"), {
      target: { value: "Joan Àlex--Smith" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Desa el nom" }));

    expect(window.localStorage.getItem(OWNER_NAME_STORAGE_KEY)).toBe("Joan Àlex--Smith");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("edits the profile name from the profile menu and rejects invalid values in Catalan", () => {
    window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, "Ada Lovelace");
    render(<AdminPage />);

    expect(screen.getByText("Ada Lovelace")).not.toBeNull();
    const profileMenuButton = screen.getByRole("button", { name: "Obre el menú de perfil" });
    fireEvent.click(profileMenuButton);
    expect(profileMenuButton.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByRole("menuitem", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Introdueix el teu nom complet"), {
      target: { value: "---" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Desa el nom" }));
    expect(screen.getByRole("alert").textContent).toBe(
      "Introdueix un nom complet que contingui com a mínim una lletra o un número.",
    );
    expect(window.localStorage.getItem(OWNER_NAME_STORAGE_KEY)).toBe("Ada Lovelace");
  });

  it("renders the existing logout action in the profile menu", () => {
    window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, "Ada Lovelace");
    render(<AdminPage />);

    fireEvent.click(screen.getByRole("button", { name: "Obre el menú de perfil" }));
    const logoutButton = screen.getByRole("menuitem", { name: "Sortir" });
    expect(logoutButton.closest("form")?.getAttribute("action")).toBe("/auth/logout");
    expect(logoutButton.closest("form")?.getAttribute("method")).toBe("POST");
  });
});
