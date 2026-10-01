import { useEffect, useRef, useState } from "react";
import { LinkGeneratorCard } from "../ui/LinkGeneratorCard";
import {
  generateSendSignatureLink,
  generateSocialTariffLink,
} from "../api/links";
import { ThemeToggle } from "../theme/ThemeToggle";
import LogoIcon from "../ui/Logo";
import { resolveInitialTheme } from "../theme/theme";
import { OwnerNameModal } from "../owner/OwnerNameModal";
import { normalizeOwner, readOwnerName, saveOwnerName } from "../owner/owner";
import { version } from "../../package.json";

export function AdminPage() {
  const [formUrl, setFormUrl] = useState("");
  const [theme, setTheme] = useState(resolveInitialTheme);
  const [ownerName, setOwnerName] = useState(readOwnerName);
  const [isEditingOwner, setIsEditingOwner] = useState(() => !normalizeOwner(ownerName));
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuButtonRef = useRef(null);
  const editProfileButtonRef = useRef(null);
  const owner = normalizeOwner(ownerName);

  useEffect(() => {
    if (isProfileMenuOpen) {
      editProfileButtonRef.current?.focus();
    }
  }, [isProfileMenuOpen]);

  const handleChangeTheme = (theme) => {
    setTheme(theme);
  };

  function handleSaveOwnerName(name) {
    saveOwnerName(name);
    setOwnerName(name);
    setIsEditingOwner(false);
  }

  function handleProfileMenuKeyDown(event) {
    if (event.key === "Escape") {
      setIsProfileMenuOpen(false);
      profileMenuButtonRef.current?.focus();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const menuItems = [...event.currentTarget.querySelectorAll('[role="menuitem"]')];
      const currentIndex = menuItems.indexOf(document.activeElement);
      const nextIndex =
        event.key === "ArrowDown"
          ? (currentIndex + 1) % menuItems.length
          : (currentIndex - 1 + menuItems.length) % menuItems.length;
      menuItems[nextIndex]?.focus();
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-brand">
          <LogoIcon theme={theme} />
          <data className="admin-version" value={version}>
            v{version}
          </data>
        </div>
        <div className="admin-actions">
          <ThemeToggle changeTheme={handleChangeTheme} />
          <div className="profile-control">
            <svg className="profile-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
            </svg>
            <span className="profile-name">{ownerName}</span>
            <button
              ref={profileMenuButtonRef}
              type="button"
              className="profile-menu-button"
              aria-label="Obre el menú de perfil"
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
              aria-controls="profile-menu"
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
            >
              <span aria-hidden="true">...</span>
            </button>
            {isProfileMenuOpen ? (
              <div id="profile-menu" className="profile-menu" role="menu" onKeyDown={handleProfileMenuKeyDown}>
                <button
                  ref={editProfileButtonRef}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsEditingOwner(true);
                  }}
                >
                  Editar
                </button>
                <form method="POST" action="/auth/logout" role="none">
                  <button type="submit" role="menuitem">Sortir</button>
                </form>
              </div>
            ) : null}
          </div>
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
          generateLink={() => generateSocialTariffLink(owner, formUrl)}
          expiryMinutes={30}
        />
        <LinkGeneratorCard
          title="Enviament de signatura"
          description={
            <>
              Genera un enllaç amb <code>sendSignature</code> activat. Al resum
              del formulari es mostra un botó per habilitar l'enviament de la
              signatura per correu electrònic.
            </>
          }
          generateLink={() => generateSendSignatureLink(owner, formUrl)}
          expiryMinutes={30}
        />
      </section>
      {isEditingOwner ? <OwnerNameModal initialName={ownerName} onSave={handleSaveOwnerName} /> : null}
    </main>
  );
}
