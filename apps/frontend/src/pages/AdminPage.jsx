import { useState } from "react";
import { LinkGeneratorCard } from "../ui/LinkGeneratorCard";
import { generateSocialTariffLink } from "../api/links";
import { ThemeToggle } from "../theme/ThemeToggle";
import LogoIcon from "../ui/Logo";
import { resolveInitialTheme } from "../theme/theme";

export function AdminPage() {
  const [formUrl, setFormUrl] = useState("");
  const [theme, setTheme] = useState(resolveInitialTheme);

  const handleChangeTheme = (theme) => {
    setTheme(theme);
  };

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <LogoIcon theme={theme} />
        </div>
        <div className="admin-actions">
          <ThemeToggle changeTheme={handleChangeTheme} />
          <form method="POST" action="/auth/logout">
            <button className="secondary-button">Sortir</button>
          </form>
        </div>
      </header>
      <div className="form-url-field">
        <label htmlFor="form-url">URL del formulari de destí (opcional)</label>
        <input
          id="form-url"
          type="url"
          value={formUrl}
          onChange={(event) => setFormUrl(event.target.value)}
          placeholder="https://somenergia.coop/ca/formulari-contractacio-periodes?form_type=domestic"
        />
      </div>

      <section className="cards-grid" aria-label="Generadors d'enllaços">
        <LinkGeneratorCard
          title="Tarifa social"
          description={
            <>
              Genera un enllaç amb <code>socialTariffByPass</code> activat. El
              formulari que es mostra no restringeix que l'usuari entri un CUPS
              amb tarifa social.
            </>
          }
          generateLink={() => generateSocialTariffLink(formUrl)}
          expiryMinutes={30}
        />
      </section>
    </main>
  );
}
