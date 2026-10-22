import { describe, expect, it } from "vitest";
import { assignmentAfterStatus } from "./ticket-assignment-rule";

describe("what a status change does to the assignee", () => {
  it("the queue lets go of whoever had it", () => {
    expect(assignmentAfterStatus("open", "carlos")).toBe("lets-go");
    expect(assignmentAfterStatus("open", null)).toBeNull();
  });

  it("work with nobody assigned is taken by whoever moves it", () => {
    expect(assignmentAfterStatus("pending", null)).toBe("takes");
    expect(assignmentAfterStatus("in-progress", null)).toBe("takes");
    expect(assignmentAfterStatus("in-progress", "carlos")).toBeNull();
  });

  it("closing keeps whoever had it", () => {
    expect(assignmentAfterStatus("resolved", null)).toBeNull();
    expect(assignmentAfterStatus("discarded", "carlos")).toBeNull();
  });
});
