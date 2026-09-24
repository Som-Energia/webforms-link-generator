function validateFormUrl(formUrl) {
  if (!formUrl.trim()) return null;

  try {
    const url = new URL(formUrl);
    if (url.protocol === "http:" || url.protocol === "https:") return formUrl.trim();
  } catch {
    // The API also validates this value before requesting a JWT.
  }

  throw new Error("L'URL del formulari ha de ser una URL HTTP o HTTPS vàlida.");
}

export async function generateSocialTariffLink(formUrl = "") {
  const customFormUrl = validateFormUrl(formUrl);
  const response = await fetch("/api/links/social-tariff", {
    method: "POST",
    headers: customFormUrl
      ? { Accept: "application/json", "Content-Type": "application/json" }
      : { Accept: "application/json" },
    body: customFormUrl ? JSON.stringify({ formUrl: customFormUrl }) : undefined,
  });

  const data = await response.json();
  const message =
    typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
      ? data.message
      : "No s'ha pogut generar l'enllaç.";

  if (!response.ok) {
    throw new Error(message);
  }

  if (typeof data !== "object" || data === null || !("link" in data) || typeof data.link !== "string") {
    throw new Error(message);
  }

  return data.link;
}
