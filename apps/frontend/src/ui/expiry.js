export const DEFAULT_EXPIRY_MINUTES = 30;

const UNIT_MINUTES = {
  min: 1,
  h: 60,
  day: 1440,
  days: 1440,
};

export function parseExpiryOption(option) {
  const match = /^(\d+)\s*(min|h|days?)$/i.exec(String(option).trim());
  if (!match) return null;

  const minutes = Number(match[1]) * UNIT_MINUTES[match[2].toLowerCase()];
  return minutes > 0 ? minutes : null;
}

export function resolveExpiryOptions(options) {
  if (!Array.isArray(options)) return [];

  const minutes = options.map(parseExpiryOption).filter((value) => value !== null);
  return [...new Set(minutes)];
}

export function formatExpiryLabel(minutes) {
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} ${days === 1 ? "dia" : "dies"}`;
  }

  if (minutes % 60 === 0) return `${minutes / 60} h`;

  return `${minutes} min`;
}
