import { describe, expect, it } from "vitest";
import { formatExpiryLabel, parseExpiryOption, resolveExpiryOptions } from "./expiry";

describe("expiry options", () => {
  it.each([
    ["30min", 30],
    ["60min", 60],
    ["2h", 120],
    ["1day", 1440],
    ["7days", 10080],
    ["7 DAYS", 10080],
  ])("parses %s as %i minutes", (option, minutes) => {
    expect(parseExpiryOption(option)).toBe(minutes);
  });

  it.each(["", "0min", "abc", "-5min", "30", "7weeks"])("ignores invalid option %j", (option) => {
    expect(parseExpiryOption(option)).toBeNull();
  });

  it("keeps valid options in order without duplicates", () => {
    expect(resolveExpiryOptions(["30min", "nope", "60min", "1h", "7days"])).toEqual([30, 60, 10080]);
    expect(resolveExpiryOptions(undefined)).toEqual([]);
  });

  it.each([
    [30, "30 min"],
    [60, "1 h"],
    [90, "90 min"],
    [1440, "1 dia"],
    [10080, "7 dies"],
  ])("labels %i minutes as %s", (minutes, label) => {
    expect(formatExpiryLabel(minutes)).toBe(label);
  });
});
