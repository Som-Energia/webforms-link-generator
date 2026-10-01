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
import { AdminPage } from "./AdminPage";
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

  it("passes the populated custom form URL to the link generator", async () => {
    const formUrl =
      "https://www.somenergia.coop/es/formulario-contratacion-periodos?form_type=enterprise&uid=3300";
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
  });

  it("renders the send signature generator and passes the custom form URL", async () => {
    const formUrl =
      "https://www.somenergia.coop/es/formulario-contratacion-periodos?form_type=enterprise&uid=3300";
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
