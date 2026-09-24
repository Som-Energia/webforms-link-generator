import { useState } from "react";
import { LinkGeneratorCard } from "../ui/LinkGeneratorCard";
import { generateSocialTariffLink } from "../api/links";

export function AdminPage() {
  const [formUrl, setFormUrl] = useState("");

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <h1>Tauler d'administració</h1>
          <p>Genera enllaços de contractació.</p>
        </div>

        <form method="POST" action="/auth/logout">
          <button className="secondary-button">Tanca la sessió</button>
        </form>
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
        <LinkGeneratorCard
          title="Botó signaturit (Proximament)"
          description={
            <>
              Genera un enllaç amb <code>enableSignaturitButton</code> activat.
              Quan arriba al resum apareix un botó per llençar la signatura
              digital de forma manual.
            </>
          }
          generateLink={() => {}}
          expiryMinutes={10080}
        />
      </section>
    </main>
  );
}
