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
import { CopyButton } from "../ui/CopyButton";
import { HelpModal } from "../help/HelpModal";
import { version } from "../../package.json";

export const DEFAULT_FORM_URL =
  "https://www.somenergia.coop/ca/formulari-contractacio-periodes?form_type=domestic";

export function createPersonalLink(formUrl, owner) {
  try {
    const url = new URL(formUrl.trim() || DEFAULT_FORM_URL);
    url.searchParams.set("owner", owner);
    return url.toString();
  } catch {
    return "";
  }
}


export const FORM_URL_ERROR =
  "Introdueix una URL HTTPS vàlida, per exemple https://www.somenergia.coop/…";

export function isValidFormUrl(formUrl) {
  const value = formUrl.trim();
  if (!value) return true;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function completeFormUrl(formUrl) {
  const value = formUrl.trim();
  if (!value || /^[a-z][a-z\d+.-]*:/i.test(value) || !value.includes(".")) {
    return value;
  }

  return `https://${value.replace(/^\/+/, "")}`;
}

function isTypingHttpsPrefix(formUrl) {
  return "https://".startsWith(formUrl.trim().toLowerCase());
}

export function AdminPage() {
  const [formUrl, setFormUrl] = useState("");
  const [isFormUrlTouched, setIsFormUrlTouched] = useState(false);
  const [includesOwner, setIncludesOwner] = useState(true);
  const [theme, setTheme] = useState(resolveInitialTheme);
  const [ownerName, setOwnerName] = useState(readOwnerName);
  const [isEditingOwner, setIsEditingOwner] = useState(
    () => !normalizeOwner(ownerName),
  );
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const helpButtonRef = useRef(null);
  const profileControlRef = useRef(null);
  const profileMenuButtonRef = useRef(null);
  const editProfileButtonRef = useRef(null);
  const formUrlInputRef = useRef(null);
  const owner = normalizeOwner(ownerName);
  const isFormUrlValid = isValidFormUrl(formUrl);
  const showFormUrlError =
    !isFormUrlValid && (isFormUrlTouched || !isTypingHttpsPrefix(formUrl));
  const personalLink =
    includesOwner && owner && isFormUrlValid
      ? createPersonalLink(formUrl, owner)
      : "";

  useEffect(() => {
    if (isProfileMenuOpen) {
      editProfileButtonRef.current?.focus();
    }
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!isProfileMenuOpen) return undefined;

    function handlePointerDown(event) {
      if (!profileControlRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isProfileMenuOpen]);

  const handleChangeTheme = (theme) => {
    setTheme(theme);
  };

  function handleSaveOwnerName(name) {
    saveOwnerName(name);
    setOwnerName(name);
    setIsEditingOwner(false);
  }

  function handleCloseHelp() {
    setIsHelpOpen(false);
    helpButtonRef.current?.focus();
  }

  function handleClearFormUrl() {
    setFormUrl("");
    setIsFormUrlTouched(false);
    formUrlInputRef.current?.focus();
  }

  function handleProfileMenuKeyDown(event) {
    if (event.key === "Escape") {
      setIsProfileMenuOpen(false);
      profileMenuButtonRef.current?.focus();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const menuItems = [
        ...event.currentTarget.querySelectorAll('[role="menuitem"]'),
      ];
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
          <span className="admin-title">Generador d'enllaços</span>
          <data className="admin-version" value={version}>
            v{version}
          </data>
        </div>
        <div className="admin-actions">
          <button
            ref={helpButtonRef}
            type="button"
            className="icon-button"
            aria-label="Ajuda: com funciona aquesta eina"
            aria-haspopup="dialog"
            title="Ajuda"
            onClick={() => setIsHelpOpen(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm-1-5h2v2h-2v-2Zm1-9a3.5 3.5 0 0 0-3.5 3.5h2a1.5 1.5 0 1 1 2.2 1.3c-.9.5-1.7 1.3-1.7 2.7v.5h2v-.5c0-.6.3-.9.8-1.2A3.5 3.5 0 0 0 12 6Z" />
            </svg>
          </button>
          <ThemeToggle changeTheme={handleChangeTheme} />
          <div className="profile-control" ref={profileControlRef}>
            <svg
              className="profile-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
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
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 10l5 5 5-5H7Z" />
              </svg>
            </button>
            {isProfileMenuOpen ? (
              <div
                id="profile-menu"
                className="profile-menu"
                role="menu"
                onKeyDown={handleProfileMenuKeyDown}
              >
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
                  <button type="submit" role="menuitem">
                    Sortir
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <section className="form-url-panel" aria-labelledby="form-url-title">
        <div className="panel-heading">
          <h1 id="form-url-title">Configura l'enllaç</h1>
          <p>
            Tria el formulari de destí i si vols identificar-te als enllaços
            que generis.
          </p>
        </div>

        <div className="form-url-field">
          <label htmlFor="form-url">URL del formulari de destí (opcional)</label>
          <div
            className={`text-input${showFormUrlError ? " text-input--invalid" : ""}`}
          >
            <svg className="text-input-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a1 1 0 1 1 1.4 1.4L12 13.4a1 1 0 0 1-1.4 0Zm-2.8 5.2a4 4 0 0 1-2.8-6.8l2.1-2.1a1 1 0 1 1 1.4 1.4l-2.1 2.1a2 2 0 0 0 2.8 2.8l2.1-2.1a1 1 0 1 1 1.4 1.4l-2.1 2.1a4 4 0 0 1-2.8 1.2Zm8-5a1 1 0 0 1-.7-1.7l2.1-2.1a2 2 0 0 0-2.8-2.8l-2.1 2.1a1 1 0 1 1-1.4-1.4l2.1-2.1a4 4 0 0 1 5.6 5.6l-2.1 2.1a1 1 0 0 1-.7.3Z" />
            </svg>
            <input
              ref={formUrlInputRef}
              id="form-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={formUrl}
              aria-invalid={showFormUrlError}
              aria-describedby="form-url-hint"
              onChange={(event) => setFormUrl(event.target.value)}
              onBlur={() => {
                setFormUrl((value) => completeFormUrl(value));
                setIsFormUrlTouched(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape" && formUrl) handleClearFormUrl();
              }}
              placeholder={DEFAULT_FORM_URL}
            />
            {formUrl ? (
              <button
                type="button"
                className="text-input-clear"
                aria-label="Esborra la URL"
                title="Esborra la URL (Esc)"
                onClick={handleClearFormUrl}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.7 5.3a1 1 0 0 0-1.4 1.4L10.6 12l-5.3 5.3a1 1 0 1 0 1.4 1.4l5.3-5.3 5.3 5.3a1 1 0 0 0 1.4-1.4L13.4 12l5.3-5.3a1 1 0 0 0-1.4-1.4L12 10.6 6.7 5.3Z" />
                </svg>
              </button>
            ) : null}
          </div>
          <p
            id="form-url-hint"
            className={showFormUrlError ? "field-error" : "field-hint"}
            aria-live="polite"
          >
            {showFormUrlError
              ? FORM_URL_ERROR
              : formUrl.trim()
                ? "S'utilitzarà aquesta URL per generar els enllaços."
                : "Si la deixes buida, s'utilitzarà el formulari de contractació domèstica."}
          </p>
        </div>

        <div className="owner-toggle-row">
          <label className="switch">
            <input
              type="checkbox"
              role="switch"
              checked={includesOwner}
              onChange={(event) => setIncludesOwner(event.target.checked)}
            />
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
            <span className="switch-label">Afegir el meu usuari</span>
          </label>
          {owner ? (
            <span className="field-hint">
              Afegeix <code>owner={owner}</code> a l'enllaç.
            </span>
          ) : null}
        </div>

        <div className="personal-link-section">
          {personalLink ? (
            <>
              <span className="field-label">El teu enllaç personal</span>
              <div className="link-controls">
                <a
                  className="url-link"
                  href={personalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {personalLink}
                </a>
                <CopyButton
                  label="Copia l'enllaç personal"
                  value={personalLink}
                />
              </div>
            </>
          ) : null}
        </div>
      </section>

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
          generateLink={() =>
            generateSocialTariffLink(includesOwner ? owner : undefined, formUrl)
          }
          owner={includesOwner ? owner : undefined}
          expiryMinutes={30}
          disabled={!isFormUrlValid}
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
          generateLink={() =>
            generateSendSignatureLink(
              includesOwner ? owner : undefined,
              formUrl,
            )
          }
          owner={includesOwner ? owner : undefined}
          expiryMinutes={30}
          disabled={!isFormUrlValid}
        />
      </section>
      {isHelpOpen ? <HelpModal onClose={handleCloseHelp} /> : null}
      {isEditingOwner ? (
        <OwnerNameModal
          initialName={ownerName}
          onSave={handleSaveOwnerName}
          onCancel={owner ? () => setIsEditingOwner(false) : undefined}
        />
      ) : null}
    </main>
  );
}
