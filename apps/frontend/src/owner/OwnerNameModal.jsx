import { useState } from "react";
import { normalizeOwner } from "./owner";

export function OwnerNameModal({ initialName, onSave, onCancel }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const owner = normalizeOwner(name);

  function handleSubmit(event) {
    event.preventDefault();
    const displayName = name.trim();

    if (!normalizeOwner(displayName)) {
      setError("L'usuari ERP és obligatori.");
      return;
    }

    onSave(displayName);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="owner-name-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-name-title"
        aria-describedby="owner-name-description"
        onKeyDown={(event) => {
          if (event.key === "Escape" && onCancel) onCancel();
        }}
      >
        <h1 id="owner-name-title">Identifica el teu enllaç</h1>
        <p id="owner-name-description">
          El teu usuari d'ERP identificarà cada enllaç generat i es guardarà a
          la fitxa del lead per identificar contractes que venen d'ET.
        </p>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="owner-name">Usuari ERP</label>
          <div className={`text-input${error ? " text-input--invalid" : ""}`}>
            <input
              id="owner-name"
              value={name}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(error)}
              aria-describedby="owner-name-hint"
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              autoFocus
            />
          </div>
          {error ? (
            <p id="owner-name-hint" className="field-error" role="alert">
              {error}
            </p>
          ) : (
            <p id="owner-name-hint" className="field-hint" aria-live="polite">
              {owner ? (
                <>
                  Apareixerà als enllaços com a <code>owner={owner}</code>.
                </>
              ) : (
                "Escriu el teu nom d'usuari tal com el fas servir a l'ERP."
              )}
            </p>
          )}
          <div className="modal-actions">
            {onCancel ? (
              <button type="button" className="ghost-button" onClick={onCancel}>
                Cancel·la
              </button>
            ) : null}
            <button type="submit" className="primary-button">
              Desa el nom d'usuari
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
