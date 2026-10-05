import { describe, expect, it } from "vitest";
import { getDateRange } from "./get-date-range";

describe("getDateRange", () => {
  const now = new Date(2026, 9, 3, 15, 30); // local time

  it("returns no bounds for all time", () => {
    expect(getDateRange("all", now)).toEqual({ dateFrom: "", dateTo: "" });
  });

  it("sends local start and end of day as real instants, not local time labelled Z", () => {
    const { dateFrom, dateTo } = getDateRange("7d", now);
    expect(new Date(dateFrom).getTime()).toBe(new Date(2026, 8, 26, 0, 0, 0, 0).getTime());
    expect(new Date(dateTo).getTime()).toBe(new Date(2026, 9, 3, 23, 59, 59, 999).getTime());
    expect(dateFrom.endsWith("Z")).toBe(true);
  });

  it("defaults unknown presets to 30 days", () => {
    const { dateFrom } = getDateRange("bogus", now);
    expect(new Date(dateFrom).getTime()).toBe(new Date(2026, 8, 3, 0, 0, 0, 0).getTime());
  });
});
