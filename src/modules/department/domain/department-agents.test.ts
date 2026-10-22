import { describe, expect, it } from "vitest";
import { agentsChanged, canBeDepartmentAgent, initialsOf, matchesPerson } from "./department-agents";

describe("department agents", () => {
  it("only the team can be in a department", () => {
    expect(["admin", "supervisor", "agent"].every(canBeDepartmentAgent)).toBe(true);
    expect(canBeDepartmentAgent("user")).toBe(false);
  });

  it("finds people by name or email, without case or accents", () => {
    const luis = { firstName: "Luis", lastName: "Martínez", email: "luis@example.com" };
    expect(matchesPerson(luis, "martinez")).toBe(true);
    expect(matchesPerson(luis, "LUIS@ex")).toBe(true);
    expect(matchesPerson(luis, "  ")).toBe(true);
    expect(matchesPerson(luis, "stephen")).toBe(false);
  });

  it("a change of order is not a change of agents", () => {
    expect(agentsChanged(["a", "b"], ["b", "a"])).toBe(false);
    expect(agentsChanged(["a"], ["a", "b"])).toBe(true);
    expect(agentsChanged(["a", "b"], ["a", "c"])).toBe(true);
  });

  it("initials for the avatars", () => {
    expect(initialsOf("stephen", "bateman")).toBe("SB");
    expect(initialsOf("", "")).toBe("?");
  });
});
