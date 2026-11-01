import { describe, expect, it } from "vitest";
import { avatarSource } from "./avatar-source";

describe("avatarSource", () => {
  it("shows the photo when there is one", () => {
    expect(avatarSource({ avatarUrl: "/a.png", userId: "01J", firstName: "Ana" })).toEqual({ kind: "photo", url: "/a.png" });
  });

  it("draws the blob from the id, not the name", () => {
    expect(avatarSource({ userId: "01J", firstName: "Ana", lastName: "López" })).toEqual({ kind: "blob", seed: "01J" });
    expect(avatarSource({ avatarUrl: null, userId: "01J", firstName: "Other" })).toEqual({ kind: "blob", seed: "01J" });
  });

  it("keeps the initials without an id", () => {
    expect(avatarSource({ firstName: "ana", lastName: "lópez" })).toEqual({ kind: "initials", initials: "AL" });
    expect(avatarSource({ userId: null, firstName: "Ana" })).toEqual({ kind: "initials", initials: "A" });
  });

  it("leaves the initials empty with neither id nor name", () => {
    expect(avatarSource({})).toEqual({ kind: "initials", initials: "" });
  });
});
