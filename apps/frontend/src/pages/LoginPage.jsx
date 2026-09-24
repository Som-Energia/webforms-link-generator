import LogoIcon from "../ui/Logo";

export function LoginPage() {
  const hasError =
    new URLSearchParams(window.location.search).get("error") === "1";

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <h1 id="login-title">
          <div>
            <LogoIcon theme="light" width="148" height="148" />
          </div>
        </h1>
        {hasError ? (
          <p className="error-box">La contrasenya no és correcta.</p>
        ) : null}

        <form method="POST" action="/auth/login" className="login-form">
          <label htmlFor="password">Contrasenya</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
          <button type="submit">Inicia la sessió</button>
        </form>
      </section>
    </main>
  );
}
