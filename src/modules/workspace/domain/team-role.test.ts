import { describe, expect, it } from "vitest";
import { isTeamRole } from "./team-role";

describe("isTeamRole", () => {
  it("counts admins, supervisors and agents as the team", () => {
    expect(["admin", "supervisor", "agent"].map(isTeamRole)).toEqual([true, true, true]);
  });

  it("leaves customers out, and anyone whose role is not known", () => {
    expect(isTeamRole("user")).toBe(false);
    expect(isTeamRole(null)).toBe(false);
    expect(isTeamRole(undefined)).toBe(false);
    expect(isTeamRole("")).toBe(false);
  });
});
