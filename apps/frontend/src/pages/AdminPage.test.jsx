import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateSocialTariffLink } from "../api/links";
import { AdminPage } from "./AdminPage";

vi.mock("../api/links", () => ({
  generateSocialTariffLink: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("AdminPage", () => {
  it("passes the populated custom form URL to the link generator", async () => {
    const formUrl =
      "https://www.somenergia.coop/es/formulario-contratacion-periodos?form_type=enterprise&uid=3300";
    generateSocialTariffLink.mockResolvedValue(`${formUrl}&token=jwt-token`);

    render(<AdminPage />);

    expect(screen.getByText("L'enllaç generat caduca al cap de 7 dies.")).not.toBeNull();

    fireEvent.change(screen.getByLabelText("URL del formulari de destí (opcional)"), {
      target: { value: formUrl },
    });
    fireEvent.click(screen.getByRole("button", { name: "Genera l'enllaç" }));

    await waitFor(() => {
      expect(generateSocialTariffLink).toHaveBeenCalledWith(formUrl);
    });
  });
});
