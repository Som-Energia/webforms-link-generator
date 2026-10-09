function validateFormUrl(formUrl) {
  if (!formUrl.trim()) return null;

  try {
    const url = new URL(formUrl);
    if (url.protocol === "https:") return formUrl.trim();
  } catch {
    // The API also validates this value before requesting a JWT.
  }

  throw new Error("L'URL del formulari ha de ser una URL HTTPS vàlida.");
}

function errorWithDetails(message, details) {
  return new Error(details ? `${message} Detalls tècnics: ${details}` : message);
}

function safeDiagnostic(details) {
  return details
    .replace(/(https?:\/\/)[^\s/@]+@/gi, "$1[redacted]@")
    .replace(/\b(token|authorization|password|secret|api[_-]?key)\b\s*([=:])\s*[^\s,&]+/gi, "$1$2[redacted]")
    .slice(0, 500);
}

async function generateFeatureFlagLink(path, formUrl = "", expiresAt) {
  const customFormUrl = validateFormUrl(formUrl);
  let response;

  try {
    response = await fetch(path, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(customFormUrl ? { formUrl: customFormUrl } : {}),
        ...(expiresAt ? { expiresAt } : {}),
      }),
    });
  } catch (error) {
    throw errorWithDetails(
      "No s'ha pogut generar l'enllaç.",
      safeDiagnostic(error instanceof Error && error.message ? error.message : "Error de xarxa desconegut."),
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw errorWithDetails("No s'ha pogut generar l'enllaç.", `Resposta no JSON (HTTP ${response.status}).`);
  }
  const message =
    typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
      ? data.message
      : "No s'ha pogut generar l'enllaç.";
  const details =
    typeof data === "object" && data !== null && "detail" in data && typeof data.detail === "string"
      ? safeDiagnostic(data.detail)
      : `HTTP ${response.status}.`;

  if (!response.ok) {
    throw errorWithDetails(message, details);
  }

  if (typeof data !== "object" || data === null || !("link" in data) || typeof data.link !== "string") {
    throw errorWithDetails(message, "La resposta no conté un enllaç vàlid.");
  }

  return data.link;
}

export async function generateSocialTariffLink(formUrl = "", expiresAt) {
  return generateFeatureFlagLink("/api/links/social-tariff", formUrl, expiresAt);
}

export async function generateSendSignatureLink(formUrl = "", expiresAt) {
  return generateFeatureFlagLink("/api/links/send-signature", formUrl, expiresAt);
}
