import { describe, it, expect } from "vitest";
import { formatResponseTime } from "./format-response-time";

describe("formatResponseTime", () => {
  it("returns minutes only when less than 1 hour", () => {
    const created = "2026-08-01T10:00:00Z";
    const response = "2026-08-01T10:35:00Z";
    expect(formatResponseTime(created, response)).toBe("35m");
  });

  it("returns 0m for instant response", () => {
    const t = "2026-08-01T10:00:00Z";
    expect(formatResponseTime(t, t)).toBe("0m");
  });

  it("returns hours and minutes when less than 1 day", () => {
    const created = "2026-08-01T10:00:00Z";
    const response = "2026-08-01T13:45:00Z";
    expect(formatResponseTime(created, response)).toBe("3h 45m");
  });

  it("returns days and hours when 1+ days", () => {
    const created = "2026-08-01T10:00:00Z";
    const response = "2026-08-03T14:30:00Z";
    expect(formatResponseTime(created, response)).toBe("2d 4h");
  });

  it("returns dash when response is before creation", () => {
    const created = "2026-08-01T10:00:00Z";
    const response = "2026-08-01T09:00:00Z";
    expect(formatResponseTime(created, response)).toBe("—");
  });

  it("handles exactly 1 hour", () => {
    const created = "2026-08-01T10:00:00Z";
    const response = "2026-08-01T11:00:00Z";
    expect(formatResponseTime(created, response)).toBe("1h 0m");
  });

  it("handles exactly 1 day", () => {
    const created = "2026-08-01T10:00:00Z";
    const response = "2026-08-02T10:00:00Z";
    expect(formatResponseTime(created, response)).toBe("1d 0h");
  });
});
