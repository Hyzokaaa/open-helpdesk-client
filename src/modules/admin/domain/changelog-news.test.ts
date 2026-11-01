import { describe, expect, it } from "vitest";
import type { ChangelogVersion } from "@modules/app/services/changelog.service";
import { compareVersions, newestVersion, unseenVersions } from "./changelog-news";

const v = (version: string): ChangelogVersion => ({ version, date: "2026-10-27", categories: [] });
const versions = (list: ChangelogVersion[]) => list.map((x) => x.version);

describe("Changelog news for the system admin", () => {
  it("compares versions by number, not by text", () => {
    expect(compareVersions("1.10.0", "1.9.0")).toBe(1);
    expect(compareVersions("v1.38.0", "1.38.0")).toBe(0);
    expect(compareVersions("1.37.2", "1.38")).toBe(-1);
  });

  it("finds the newest version whatever order the list comes in", () => {
    expect(newestVersion([v("1.37.2"), v("1.39.0"), v("1.38.0")])).toBe("1.39.0");
    expect(newestVersion([])).toBeNull();
  });

  it("shows every version after the last one seen, newest first", () => {
    const changelog = [v("1.39.0"), v("1.38.0"), v("1.37.2"), v("1.37.0")];
    expect(versions(unseenVersions(changelog, "1.37.2"))).toEqual(["1.39.0", "1.38.0"]);
  });

  it("has nothing new once the newest version was seen", () => {
    expect(unseenVersions([v("1.39.0"), v("1.38.0")], "1.39.0")).toEqual([]);
  });

  it("shows only the newest version to an admin who has seen nothing yet, not the whole history", () => {
    expect(versions(unseenVersions([v("1.38.0"), v("1.39.0"), v("1.37.0")], null))).toEqual(["1.39.0"]);
  });

  it("has nothing to show without a changelog", () => {
    expect(unseenVersions([], null)).toEqual([]);
    expect(unseenVersions([], "1.38.0")).toEqual([]);
  });
});
