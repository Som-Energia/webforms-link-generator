import { useEffect, useId, useRef, useState } from "react";
import { CopyButton } from "./CopyButton";
import { LEAD_TAG_PARAM } from "../campaign/leadTag";
import { DEFAULT_EXPIRY_MINUTES, formatExpiryLabel, resolveExpiryOptions } from "./expiry";

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

export function updateLinkParam(link, name, value) {
  try {
    const url = new URL(link);
    if (!isSafeLink(link)) return link;
    if (!value && !url.searchParams.has(name)) return link;

    if (value) {
      url.searchParams.set(name, value);
    } else {
      url.searchParams.delete(name);
    }

    return url.toString();
  } catch {
    return link;
  }
}

export function updateLinkOwner(link, owner) {
  return updateLinkParam(link, "owner", owner);
}

export function LinkGeneratorCard({ title, description, generateLink, owner, leadTag, expiryOptions, disabled = false }) {
  const expiryChoices = resolveExpiryOptions(expiryOptions);
  const hasExpiryChoice = expiryChoices.length > 0;
  const [selectedExpiry, setSelectedExpiry] = useState(expiryChoices[0] ?? DEFAULT_EXPIRY_MINUTES);
  const expiryMinutes = expiryChoices.includes(selectedExpiry)
    ? selectedExpiry
    : (expiryChoices[0] ?? DEFAULT_EXPIRY_MINUTES);
  const expiryGroupId = useId();
  const [isLoading, setIsLoading] = useState(false);
  const [link, setLink] = useState(null);
  const [error, setError] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const isMounted = useRef(true);
  const latestLinkParams = useRef({ owner, leadTag });
  latestLinkParams.current = { owner, leadTag };

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

  useEffect(() => {
    setLink((currentLink) => (currentLink ? updateLinkParam(currentLink, LEAD_TAG_PARAM, leadTag) : currentLink));
  }, [leadTag]);

  async function handleGenerate() {
    setIsLoading(true);
    setLink(null);
    setError(null);
    setExpiresAt(null);
    setRemainingSeconds(null);

    try {
      const linkExpiresAt = Date.now() + expiryMinutes * 60 * 1000;
      const generatedLink = await generateLink(
        hasExpiryChoice ? new Date(linkExpiresAt).toISOString() : undefined,
      );
      if (!isMounted.current) return;

      const { owner: currentOwner, leadTag: currentLeadTag } = latestLinkParams.current;
      setLink(updateLinkParam(updateLinkOwner(generatedLink, currentOwner), LEAD_TAG_PARAM, currentLeadTag));

      setExpiresAt(linkExpiresAt);
      setRemainingSeconds(Math.max(0, Math.ceil((linkExpiresAt - Date.now()) / 1000)));
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

        {expiryChoices.length > 1 ? (
          <div className="segmented-control" role="radiogroup" aria-label="Caducitat de l'enllaç">
            {expiryChoices.map((minutes) => (
              <label key={minutes} className="segmented-option">
                <input
                  type="radio"
                  name={expiryGroupId}
                  value={minutes}
                  checked={minutes === expiryMinutes}
                  disabled={isLoading}
                  onChange={() => setSelectedExpiry(minutes)}
                />
                <span aria-hidden="true">{formatExpiryLabel(minutes)}</span>
                <span className="visually-hidden">{formatExpiryDuration(minutes)}</span>
              </label>
            ))}
          </div>
        ) : null}
      </div>

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
