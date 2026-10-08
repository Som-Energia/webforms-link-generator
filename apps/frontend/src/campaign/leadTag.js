export const LEAD_TAG_STORAGE_KEY = "webforms-links-generator-lead-tag";
export const LEAD_TAG_PARAM = "lead_tag";

export function readLeadTagSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(LEAD_TAG_STORAGE_KEY) ?? "null");
    return {
      isEnabled: saved?.isEnabled === true,
      tag: typeof saved?.tag === "string" ? saved.tag : "",
    };
  } catch {
    return { isEnabled: false, tag: "" };
  }
}

export function saveLeadTagSettings(settings) {
  try {
    window.localStorage.setItem(LEAD_TAG_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be blocked in private or embedded contexts; the in-memory value still works.
  }
}
