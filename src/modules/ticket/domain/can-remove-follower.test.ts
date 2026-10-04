import { describe, expect, it } from "vitest";
import { canRemoveFollower } from "./can-remove-follower";

describe("canRemoveFollower", () => {
  it("lets anyone unfollow themselves, even without the manage permission", () => {
    expect(canRemoveFollower("u1", "u1", false)).toBe(true);
  });

  it("needs the manage permission to remove someone else", () => {
    expect(canRemoveFollower("u2", "u1", false)).toBe(false);
    expect(canRemoveFollower("u2", "u1", true)).toBe(true);
  });

  it("falls back to the permission before the user has loaded", () => {
    expect(canRemoveFollower("u1", undefined, false)).toBe(false);
    expect(canRemoveFollower("u1", undefined, true)).toBe(true);
  });
});
