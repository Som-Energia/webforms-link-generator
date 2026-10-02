import { useState } from "react";
import { normalizeOwner } from "./owner";

export function OwnerNameModal({ initialName, onSave }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const displayName = name.trim();

    if (!normalizeOwner(displayName)) {
      setError("Usuari ERP es obligatori.");
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
      >
        <h1 id="owner-name-title">Identifica el teu enllaç</h1>
        <p>
          El teu usuari d'ERP identificarà cada enllaç generat i es guardarà a
          la fitxa del lead per identificar contractes que venen d'ET.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="owner-name">Usuari ERP</label>
          <input
            id="owner-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            autoFocus
          />
          {error ? (
            <p className="error-box" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="primary-button">
            Desa el nom d'usuari
          </button>
        </form>
      </section>
    </div>
  );
}
