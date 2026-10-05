import { describe, it, expect } from "vitest";
import { canCreateWorkspace } from "./can-create-workspace";

const user = (createWorkspace: boolean) => ({ capabilities: { createWorkspace } });

describe("canCreateWorkspace", () => {
  it("follows what the backend says the user may do", () => {
    expect(canCreateWorkspace(user(true), false)).toBe(true);
    expect(canCreateWorkspace(user(false), false)).toBe(false);
  });

  it("never offers it on a custom domain", () => {
    expect(canCreateWorkspace(user(true), true)).toBe(false);
  });

  it("offers nothing before the profile has loaded", () => {
    expect(canCreateWorkspace(null, false)).toBe(false);
  });
});
