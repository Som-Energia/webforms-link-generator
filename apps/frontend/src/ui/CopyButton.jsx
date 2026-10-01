import { useEffect, useRef, useState } from "react";

export const COPY_FEEDBACK_DELAY = 2000;

export function CopyButton({ label, value, disabled = false }) {
  const [feedback, setFeedback] = useState(null);
  const resetTimeout = useRef(null);
  const copyRequest = useRef(0);

  useEffect(() => {
    return () => {
      copyRequest.current += 1;
      window.clearTimeout(resetTimeout.current);
    };
  }, []);

  function showFeedback(nextFeedback, request) {
    setFeedback(nextFeedback);
    resetTimeout.current = window.setTimeout(() => {
      if (copyRequest.current === request) setFeedback(null);
    }, COPY_FEEDBACK_DELAY);
  }

  async function handleCopy() {
    const request = copyRequest.current + 1;
    copyRequest.current = request;
    window.clearTimeout(resetTimeout.current);
    setFeedback(null);

    try {
      await navigator.clipboard.writeText(value);
      if (copyRequest.current === request) showFeedback("success", request);
    } catch {
      if (copyRequest.current === request) showFeedback("error", request);
    }
  }

  return (
    <span className="copy-control">
      <button
        type="button"
        className="copy-button"
        aria-label={label}
        onClick={handleCopy}
        disabled={disabled}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H9Zm0 2h8v10H9V9Zm-4-6a2 2 0 0 0-2 2v10h2V5h8V3H5Z" />
        </svg>
      </button>
      {feedback ? (
        <span className={`copy-tooltip copy-tooltip--${feedback}`} role="status" aria-live="polite">
          {feedback === "success" ? "Copiat" : "No s'ha pogut copiar. Torna-ho a provar."}
        </span>
      ) : null}
    </span>
  );
}
