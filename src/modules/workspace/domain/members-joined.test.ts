import { describe, expect, it } from "vitest";
import { joinedMemberIds } from "./members-joined";

describe("members who just joined", () => {
  it("reads the ids the notice links with", () => {
    expect([...joinedMemberIds(new URLSearchParams("joined=u1,u2"))]).toEqual(["u1", "u2"]);
  });

  it("is empty when the page is opened any other way", () => {
    expect(joinedMemberIds(new URLSearchParams("")).size).toBe(0);
    expect(joinedMemberIds(new URLSearchParams("joined=, ,")).size).toBe(0);
  });
});
