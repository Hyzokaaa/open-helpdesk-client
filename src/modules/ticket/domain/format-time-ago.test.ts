import { describe, expect, it } from "vitest";
import { formatTimeAgo } from "./format-time-ago";

const now = new Date("2026-10-12T12:00:00Z");

describe("formatTimeAgo", () => {
  it("names the largest whole unit", () => {
    expect(formatTimeAgo("2026-08-10T12:00:00Z", "en", now)).toBe("2 months ago");
    expect(formatTimeAgo("2026-10-12T09:00:00Z", "es", now)).toBe("hace 3 horas");
  });

  it("reads under a minute as now", () => {
    expect(formatTimeAgo("2026-10-12T11:59:40Z", "es", now)).toBe("ahora");
    expect(formatTimeAgo("2026-10-12T11:59:40Z", "en", now)).toBe("now");
  });
});
