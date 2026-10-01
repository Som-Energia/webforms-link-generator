import { useState } from "react";
import { normalizeOwner } from "./owner";

export function OwnerNameModal({ initialName, onSave }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const displayName = name.trim();

    if (!normalizeOwner(displayName)) {
      setError("Introdueix un nom complet que contingui com a mínim una lletra o un número.");
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
        <p>La forma normalitzada del teu nom complet identificarà cada enllaç generat.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="owner-name">Introdueix el teu nom complet</label>
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
            Desa el nom
          </button>
        </form>
      </section>
    </div>
  );
}
