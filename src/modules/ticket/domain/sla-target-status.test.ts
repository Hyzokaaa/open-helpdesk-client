import { describe, expect, it } from "vitest";
import { slaTargetStatus } from "./sla-target-status";

const createdAt = "2026-10-12T08:00:00Z";
const now = new Date("2026-10-12T10:00:00Z");

describe("slaTargetStatus", () => {
  it("has nothing to say without a target", () => {
    expect(slaTargetStatus({ targetHours: null, createdAt, completedAt: null, breached: false, now })).toBeNull();
  });

  it("is met when reached in time, missed when late or flagged by the backend", () => {
    expect(slaTargetStatus({ targetHours: 4, createdAt, completedAt: "2026-10-12T09:00:00Z", breached: false, now })).toEqual({ kind: "met" });
    expect(slaTargetStatus({ targetHours: 4, createdAt, completedAt: "2026-10-12T13:00:00Z", breached: false, now })).toEqual({ kind: "missed" });
    expect(slaTargetStatus({ targetHours: 4, createdAt, completedAt: "2026-10-12T09:00:00Z", breached: true, now })).toEqual({ kind: "missed" });
  });

  it("tells the time left, low under a quarter of the target", () => {
    expect(slaTargetStatus({ targetHours: 4, createdAt, completedAt: null, breached: false, now })).toEqual({ kind: "remaining", ms: 2 * 3600000, low: false });
    expect(slaTargetStatus({ targetHours: 2.5, createdAt, completedAt: null, breached: false, now })).toEqual({ kind: "remaining", ms: 0.5 * 3600000, low: true });
  });

  it("tells how long it is overdue", () => {
    expect(slaTargetStatus({ targetHours: 1, createdAt, completedAt: null, breached: true, now })).toEqual({ kind: "overdue", ms: 3600000 });
  });
});
