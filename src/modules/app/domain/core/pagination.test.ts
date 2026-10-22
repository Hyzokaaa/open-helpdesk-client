import { describe, expect, it } from "vitest";
import { clampPage, getPageRange, pageItemRange, parsePageParam, parsePageSize, totalPages } from "./pagination";

describe("pagination", () => {
  it("shows every page up to seven", () => {
    expect(getPageRange(1, 1)).toEqual([1]);
    expect(getPageRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("keeps the first, the last and the current page with its neighbours, at a steady width", () => {
    expect(getPageRange(1, 9)).toEqual([1, 2, 3, 4, 5, "gap", 9]);
    expect(getPageRange(3, 9)).toEqual([1, 2, 3, 4, 5, "gap", 9]);
    expect(getPageRange(5, 9)).toEqual([1, "gap", 4, 5, 6, "gap", 9]);
    expect(getPageRange(7, 9)).toEqual([1, "gap", 5, 6, 7, 8, 9]);
    expect(getPageRange(9, 9)).toEqual([1, "gap", 5, 6, 7, 8, 9]);
  });

  it("never hides a single page behind a gap", () => {
    expect(getPageRange(4, 8)).toEqual([1, 2, 3, 4, 5, "gap", 8]);
    expect(getPageRange(5, 8)).toEqual([1, "gap", 4, 5, 6, 7, 8]);
    for (let pages = 8; pages <= 30; pages++) {
      for (let page = 1; page <= pages; page++) {
        const slots = getPageRange(page, pages);
        expect(slots).toContain(page);
        expect(slots.length).toBe(7);
        slots.forEach((s, i) => {
          if (s === "gap") expect((slots[i + 1] as number) - (slots[i - 1] as number)).toBeGreaterThan(2);
        });
      }
    }
  });

  it("says which items a page holds", () => {
    expect(pageItemRange(3, 20, 172)).toEqual({ from: 41, to: 60 });
    expect(pageItemRange(9, 20, 172)).toEqual({ from: 161, to: 172 });
    expect(pageItemRange(1, 20, 0)).toEqual({ from: 0, to: 0 });
  });

  it("moves to the last page that still exists", () => {
    expect(totalPages(0, 20)).toBe(1);
    expect(totalPages(41, 20)).toBe(3);
    expect(clampPage(3, 40, 20)).toBe(2);
    expect(clampPage(3, 0, 20)).toBe(1);
    expect(clampPage(2, 100, 20)).toBe(2);
  });

  it("reads the page and the page size safely", () => {
    expect(parsePageParam("3")).toBe(3);
    for (const bad of [null, "", "0", "-2", "1.5", "abc"]) expect(parsePageParam(bad)).toBe(1);
    expect(parsePageSize("50")).toBe(50);
    for (const bad of [null, "30", "1000", "x"]) expect(parsePageSize(bad)).toBe(20);
  });
});
