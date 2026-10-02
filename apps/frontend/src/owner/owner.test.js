import { describe, expect, it } from "vitest";
import { normalizeOwner } from "./owner";

describe("normalizeOwner", () => {
  it.each([
    ["Joan Àlex--Smith", "joan-alex-smith"],
    ["  Ada   Lovelace  ", "ada-lovelace"],
    ["---", ""],
  ])("normalizes %s as %s", (name, owner) => {
    expect(normalizeOwner(name)).toBe(owner);
  });
});
