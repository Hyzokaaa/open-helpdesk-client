import { describe, expect, it } from "vitest";
import { canBeAssignee } from "./can-be-assignee";

describe("canBeAssignee", () => {
  it("offers the roles that can pick up tickets", () => {
    expect(canBeAssignee("admin")).toBe(true);
    expect(canBeAssignee("supervisor")).toBe(true);
    expect(canBeAssignee("agent")).toBe(true);
  });

  it("never offers users or unknown roles", () => {
    expect(canBeAssignee("user")).toBe(false);
    expect(canBeAssignee("reporter")).toBe(false);
    expect(canBeAssignee("")).toBe(false);
  });
});
