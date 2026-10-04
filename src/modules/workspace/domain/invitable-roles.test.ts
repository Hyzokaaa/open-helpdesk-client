import { describe, expect, it } from "vitest";
import { invitableRoles } from "./invitable-roles";

describe("invitableRoles", () => {
  it("lets workspace admins and system admins invite admins", () => {
    expect(invitableRoles("admin", false)).toEqual(["admin", "supervisor", "agent"]);
    expect(invitableRoles(undefined, true)).toEqual(["admin", "supervisor", "agent"]);
  });

  it("stops a supervisor at their own role", () => {
    expect(invitableRoles("supervisor", false)).toEqual(["supervisor", "agent"]);
  });

  it("never offers admin while the requester's role is still unknown", () => {
    expect(invitableRoles(undefined, false)).toEqual(["supervisor", "agent"]);
  });
});
