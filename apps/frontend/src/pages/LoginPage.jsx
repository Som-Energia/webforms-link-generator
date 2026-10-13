import LogoIcon from "../ui/Logo";
import { resolveInitialTheme } from "../theme/theme";

export function LoginPage() {
  const hasError =
    new URLSearchParams(window.location.search).get("error") === "1";

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <LogoIcon theme={resolveInitialTheme()} width="148" height="91" />
        <h1 id="login-title">Generador d'enllaços</h1>
        <p className="login-subtitle">Accés reservat a l'equip intern.</p>
        {hasError ? (
          <p className="error-box" role="alert">
            La contrasenya no és correcta.
          </p>
        ) : null}

        <form method="POST" action="/auth/login" className="login-form">
          <label htmlFor="password">Contrasenya</label>
          <div className={`text-input${hasError ? " text-input--invalid" : ""}`}>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              aria-invalid={hasError}
            />
          </div>
          <button type="submit" className="primary-button">
            Inicia la sessió
          </button>
        </form>
      </section>
    </main>
  );
}
