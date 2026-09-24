import { useEffect, useRef, useState } from "react";

export function formatExpiryDuration(expiryMinutes) {
  const days = Math.floor(expiryMinutes / 1440);
  const hours = Math.floor((expiryMinutes % 1440) / 60);
  const minutes = expiryMinutes % 60;
  const parts = [];

  if (days) parts.push(`${days} ${days === 1 ? "dia" : "dies"}`);
  if (hours) parts.push(`${hours} ${hours === 1 ? "hora" : "hores"}`);
  if (minutes || parts.length === 0) parts.push(`${minutes} ${minutes === 1 ? "minut" : "minuts"}`);

  return parts.join(" i ");
}

export function formatCountdown(remainingSeconds) {
  const days = Math.floor(remainingSeconds / 86400);
  const hours = Math.floor((remainingSeconds % 86400) / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  if (days) {
    return `${days} ${days === 1 ? "dia" : "dies"} ${String(hours).padStart(2, "0")} h ${String(minutes).padStart(2, "0")} min ${String(seconds).padStart(2, "0")} s`;
  }

  if (hours) {
    return `${hours} h ${String(minutes).padStart(2, "0")} min ${String(seconds).padStart(2, "0")} s`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function LinkGeneratorCard({ title, description, generateLink, expiryMinutes }) {
  const [isLoading, setIsLoading] = useState(false);
  const [link, setLink] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const isMounted = useRef(true);
  const copyResetTimeout = useRef(null);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      window.clearTimeout(copyResetTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!expiresAt) return undefined;

    function updateRemainingTime() {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      return remaining;
    }

    if (updateRemainingTime() === 0) return undefined;

    const intervalId = window.setInterval(() => {
      if (updateRemainingTime() === 0) window.clearInterval(intervalId);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [expiresAt]);

  async function handleGenerate() {
    setIsLoading(true);
    setLink(null);
    setError(null);
    setCopied(false);
    setExpiresAt(null);
    setRemainingSeconds(null);

    try {
      const generatedLink = await generateLink();
      if (!isMounted.current) return;

      setLink(generatedLink);

      if (expiryMinutes) {
        setExpiresAt(Date.now() + expiryMinutes * 60 * 1000);
        setRemainingSeconds(expiryMinutes * 60);
      }
    } catch (error) {
      if (!isMounted.current) return;

      setError(error instanceof Error ? error.message : "S'ha produït un error inesperat.");
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!link || remainingSeconds === 0) return;

    await navigator.clipboard.writeText(link);
    if (!isMounted.current) return;

    setCopied(true);
    window.clearTimeout(copyResetTimeout.current);
    copyResetTimeout.current = window.setTimeout(() => {
      if (isMounted.current) setCopied(false);
    }, 2000);
  }

  const isExpired = remainingSeconds === 0;
  const countdown = remainingSeconds === null ? null : formatCountdown(remainingSeconds);

  return (
    <article className="generator-card">
      <h2>{title}</h2>
      <p>{description}</p>

      <div className="generator-actions">
        <button type="button" className="primary-button" onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? "S'està generant..." : "Genera l'enllaç"}
        </button>

        {expiryMinutes ? (
          <p className="expiry-notice" role="status" aria-live="polite">
            {isExpired
              ? "L'enllaç ha expirat."
              : countdown
                ? `L'enllaç caduca en ${countdown}.`
                : `L'enllaç generat caduca al cap de ${formatExpiryDuration(expiryMinutes)}.`}
          </p>
        ) : null}
      </div>

      {error ? <div className="result-error">{error}</div> : null}

      {link ? (
        <div className="result-box">
          <input value={link} readOnly aria-label="Enllaç generat" />
          <button type="button" className="copy-button" onClick={handleCopy} disabled={isExpired}>
            {copied ? "Copiat!" : "Copia l'enllaç"}
          </button>
        </div>
      ) : null}
    </article>
  );
}
