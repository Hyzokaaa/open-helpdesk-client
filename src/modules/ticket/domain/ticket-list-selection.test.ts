import { describe, expect, it } from "vitest";
import {
  EMPTY_SELECTION, FILTER_MINE, FILTER_NONE, TicketListSelection, isDefaultStatuses, parseSelection, pruneSelection,
  selectionFilterCount, shownStatuses, statusesParam, toggleAllStatuses, toggleStatus,
} from "./ticket-list-selection";

const ALL = ["open", "pending", "in-progress", "resolved", "discarded"];
const withStatuses = (statuses: string[] | null): TicketListSelection => ({ ...EMPTY_SELECTION, statuses });

describe("ticket list selection", () => {
  it("shows the active statuses to the team and every status to requesters by default", () => {
    expect(shownStatuses(EMPTY_SELECTION, false)).toEqual(["open", "pending", "in-progress"]);
    expect(shownStatuses(EMPTY_SELECTION, true)).toEqual(ALL);
    expect(statusesParam(EMPTY_SELECTION, false)).toEqual(["open", "pending", "in-progress"]);
    expect(statusesParam(EMPTY_SELECTION, true)).toBeUndefined();
  });

  it("ticks and unticks statuses, and the default is not a filter", () => {
    const withResolved = withStatuses(toggleStatus(EMPTY_SELECTION, "resolved", false));
    expect(shownStatuses(withResolved, false)).toEqual(["open", "pending", "in-progress", "resolved"]);
    expect(selectionFilterCount(withResolved, false)).toBe(1);
    // Unticking it again is the default once more
    expect(toggleStatus(withResolved, "resolved", false)).toBeNull();
    expect(selectionFilterCount(EMPTY_SELECTION, false)).toBe(0);
  });

  it("the last status ticked cannot be unticked", () => {
    const onlyOpen = withStatuses(["open"]);
    expect(toggleStatus(onlyOpen, "open", false)).toEqual(["open"]);
    expect(toggleStatus(onlyOpen, "resolved", false)).toEqual(["open", "resolved"]);
  });

  it("All ticks every status, and again goes back to the default", () => {
    const all = withStatuses(toggleAllStatuses(EMPTY_SELECTION, false));
    expect(shownStatuses(all, false)).toEqual(ALL);
    expect(statusesParam(all, false)).toBeUndefined();
    expect(toggleAllStatuses(all, false)).toBeNull();
    expect(isDefaultStatuses(withStatuses(toggleAllStatuses(all, false)), false)).toBe(true);
  });

  it("counts a filter once however many values it has", () => {
    expect(selectionFilterCount({ ...EMPTY_SELECTION, priorities: ["high", "critical"], tagIds: ["a", "b", "c"] }, false)).toBe(2);
  });

  it("reads back only what can still be a value", () => {
    const raw = JSON.stringify({ statuses: ["resolved", "closed"], priorities: ["high", "urgent"], departmentIds: ["d1", FILTER_NONE, 7], tagIds: [FILTER_NONE, "t1"] });
    expect(parseSelection(raw)).toEqual({ ...EMPTY_SELECTION, statuses: ["resolved"], priorities: ["high"], departmentIds: ["d1", FILTER_NONE], tagIds: ["t1"] });
    expect(parseSelection(JSON.stringify({ reopened: true })).reopened).toBe(true);
    expect(parseSelection(JSON.stringify({ reopened: "yes" })).reopened).toBe(false);
  });

  it("falls back to the default for anything broken", () => {
    for (const raw of [null, "", "{", "[]", "null", "5", JSON.stringify({ statuses: ["closed"] })]) {
      expect(parseSelection(raw)).toEqual(EMPTY_SELECTION);
    }
  });

  it("drops the ids that no longer exist, keeping 'none'", () => {
    const selection = { ...EMPTY_SELECTION, departmentIds: ["gone", FILTER_NONE, FILTER_MINE, "d1"], tagIds: ["t1", "gone"] };
    expect(pruneSelection(selection, { departmentIds: ["d1"], tagIds: ["t1"] }))
      .toEqual({ ...selection, departmentIds: [FILTER_NONE, FILTER_MINE, "d1"], tagIds: ["t1"] });
    // Nothing to drop: the same object, so nothing reloads
    const clean = { ...EMPTY_SELECTION, departmentIds: ["d1"] };
    expect(pruneSelection(clean, { departmentIds: ["d1"] })).toBe(clean);
    // A list not loaded is not checked
    expect(pruneSelection(selection, {})).toBe(selection);
  });
});
