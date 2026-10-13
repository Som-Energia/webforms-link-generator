export const OWNER_NAME_STORAGE_KEY = "webforms-links-generator-owner-name";

export function normalizeOwner(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function readOwnerName() {
  try {
    return window.localStorage.getItem(OWNER_NAME_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveOwnerName(name) {
  window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, name);
}
