import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateSendSignatureLink, generateSocialTariffLink } from "../api/links";
import { AdminPage } from "./AdminPage";

vi.mock("../api/links", () => ({
  generateSendSignatureLink: vi.fn(),
  generateSocialTariffLink: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminPage", () => {
  it("passes the populated custom form URL to the link generator", async () => {
    const formUrl =
      "https://www.somenergia.coop/es/formulario-contratacion-periodos?form_type=enterprise&uid=3300";
    generateSocialTariffLink.mockResolvedValue(`${formUrl}&token=jwt-token`);

    render(<AdminPage />);

    const socialTariffCard = screen.getByRole("heading", { name: "Tarifa social" }).closest("article");
    expect(socialTariffCard).not.toBeNull();
    expect(within(socialTariffCard).getByText("L'enllaç generat caduca al cap de 30 minuts.")).not.toBeNull();

    fireEvent.change(screen.getByLabelText("URL del formulari de destí (opcional)"), {
      target: { value: formUrl },
    });
    fireEvent.click(within(socialTariffCard).getByRole("button", { name: "Genera l'enllaç" }));

    await waitFor(() => {
      expect(generateSocialTariffLink).toHaveBeenCalledWith(formUrl);
    });
  });

  it("renders the send signature generator and passes the custom form URL", async () => {
    const formUrl =
      "https://www.somenergia.coop/es/formulario-contratacion-periodos?form_type=enterprise&uid=3300";
    generateSendSignatureLink.mockResolvedValue(`${formUrl}&token=jwt-token`);

    render(<AdminPage />);

    const sendSignatureCard = screen.getByRole("heading", { name: "Enviament de signatura" }).closest("article");
    expect(sendSignatureCard).not.toBeNull();
    expect(within(sendSignatureCard).getByText(/sendSignature/)).not.toBeNull();

    fireEvent.change(screen.getByLabelText("URL del formulari de destí (opcional)"), {
      target: { value: formUrl },
    });
    fireEvent.click(within(sendSignatureCard).getByRole("button", { name: "Genera l'enllaç" }));

    await waitFor(() => {
      expect(generateSendSignatureLink).toHaveBeenCalledWith(formUrl);
    });
  });
});
