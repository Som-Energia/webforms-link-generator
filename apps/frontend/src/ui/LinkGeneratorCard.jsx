import { useEffect, useRef, useState } from "react";
import { CopyButton } from "./CopyButton";

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

function isSafeLink(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function updateLinkOwner(link, owner) {
  try {
    const url = new URL(link);
    if (!isSafeLink(link)) return link;

    if (owner) {
      url.searchParams.set("owner", owner);
    } else {
      url.searchParams.delete("owner");
    }

    return url.toString();
  } catch {
    return link;
  }
}

export function LinkGeneratorCard({ title, description, generateLink, owner, expiryMinutes, disabled = false }) {
  const [isLoading, setIsLoading] = useState(false);
  const [link, setLink] = useState(null);
  const [error, setError] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
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

  useEffect(() => {
    setLink((currentLink) => (currentLink ? updateLinkOwner(currentLink, owner) : currentLink));
  }, [owner]);

  async function handleGenerate() {
    setIsLoading(true);
    setLink(null);
    setError(null);
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

  const isExpired = remainingSeconds === 0;
  const countdown = remainingSeconds === null ? null : formatCountdown(remainingSeconds);
  const canOpenLink = link !== null && isSafeLink(link);

  return (
    <article className="generator-card">
      <h2>{title}</h2>
      <p>{description}</p>

      <div className="generator-actions">
        <button
          type="button"
          className="primary-button"
          onClick={handleGenerate}
          disabled={isLoading || disabled}
          aria-busy={isLoading}
        >
          {isLoading ? <span className="spinner" aria-hidden="true" /> : null}
          {isLoading ? "S'està generant..." : "Genera l'enllaç"}
        </button>

        {expiryMinutes ? (
          <p
            className={`expiry-notice${isExpired ? " expiry-notice--expired" : countdown ? " expiry-notice--active" : ""}`}
            role="status"
            aria-live="polite"
          >
            {isExpired
              ? "L'enllaç ha expirat."
              : countdown
                ? `L'enllaç caduca en ${countdown}.`
                : `L'enllaç generat caduca al cap de ${formatExpiryDuration(expiryMinutes)}.`}
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="result-error" role="alert">
          {error}
        </div>
      ) : null}

      {link ? (
        <div className={`result-box${isExpired ? " result-box--expired" : ""}`}>
          <div className="link-controls">
            {canOpenLink && !isExpired ? (
              <a className="url-link" href={link} target="_blank" rel="noopener noreferrer">
                {link}
              </a>
            ) : (
              <span className="url-link">{link}</span>
            )}
            <CopyButton
              label="Copia l'enllaç"
              value={link}
              disabled={isExpired}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}
