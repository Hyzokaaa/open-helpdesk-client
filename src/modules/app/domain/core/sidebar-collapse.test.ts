import { describe, expect, it } from "vitest";
import { isSidebarCollapsed, isSidebarShortcut, readCollapsedChoice, sidebarCollapsedKey } from "./sidebar-collapse";

describe("isSidebarCollapsed", () => {
  const phone = { lg: false, xl: false };
  const laptop = { lg: true, xl: false };
  const desktop = { lg: true, xl: true };

  it("never folds the phone drawer, whatever was chosen", () => {
    expect(isSidebarCollapsed(phone, null)).toBe(false);
    expect(isSidebarCollapsed(phone, true)).toBe(false);
  });

  it("starts folded on a laptop-sized screen and unfolded on a larger one", () => {
    expect(isSidebarCollapsed(laptop, null)).toBe(true);
    expect(isSidebarCollapsed(desktop, null)).toBe(false);
  });

  it("keeps the person's choice on any wide screen", () => {
    expect(isSidebarCollapsed(desktop, true)).toBe(true);
    expect(isSidebarCollapsed(laptop, false)).toBe(false);
  });
});

describe("readCollapsedChoice", () => {
  it("reads the stored choice, and nothing else as one", () => {
    expect(readCollapsedChoice("1")).toBe(true);
    expect(readCollapsedChoice("0")).toBe(false);
    expect(readCollapsedChoice(null)).toBeNull();
    expect(readCollapsedChoice("yes")).toBeNull();
  });

  it("keeps it per user", () => {
    expect(sidebarCollapsedKey("u1")).not.toBe(sidebarCollapsedKey("u2"));
  });
});

describe("isSidebarShortcut", () => {
  const press = { key: "[", metaKey: false, ctrlKey: false, repeat: false, altGraph: false, inEditableOrDialog: false };

  it("takes a plain [", () => {
    expect(isSidebarShortcut(press)).toBe(true);
  });

  it("takes [ typed with AltGr, as on a Spanish keyboard, which arrives as Ctrl+Alt", () => {
    expect(isSidebarShortcut({ ...press, ctrlKey: true, altGraph: true })).toBe(true);
  });

  it("leaves Ctrl+[, Cmd+[, held keys and other keys alone", () => {
    expect(isSidebarShortcut({ ...press, ctrlKey: true })).toBe(false);
    expect(isSidebarShortcut({ ...press, metaKey: true })).toBe(false);
    expect(isSidebarShortcut({ ...press, repeat: true })).toBe(false);
    expect(isSidebarShortcut({ ...press, key: "]" })).toBe(false);
  });

  it("never fires while typing or inside a dialog", () => {
    expect(isSidebarShortcut({ ...press, inEditableOrDialog: true })).toBe(false);
  });
});
