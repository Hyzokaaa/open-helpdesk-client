import { describe, expect, it } from "vitest";
import { formatDetailValue, formatInlineValue, isStructuredValue } from "./audit-metadata";

describe("audit metadata values", () => {
  it("shows primitives as they are and absent values as a dash", () => {
    expect(formatInlineValue("file")).toBe("file");
    expect(formatInlineValue(42)).toBe("42");
    expect(formatInlineValue(false)).toBe("false");
    expect(formatInlineValue(null)).toBe("—");
    expect(formatInlineValue(undefined)).toBe("—");
  });

  it("never shows an object as [object Object]", () => {
    const imported = { ticketsImported: 3, settingsApplied: ["name"] };
    expect(formatInlineValue(imported)).toBe('{"ticketsImported":3,"settingsApplied":["name"]}');
    expect(formatDetailValue(imported)).toBe('{\n  "ticketsImported": 3,\n  "settingsApplied": [\n    "name"\n  ]\n}');
    expect(formatDetailValue(["a", "b"])).toContain('"a"');
    expect(formatDetailValue("plain")).toBe("plain");
  });

  it("tells structured values apart", () => {
    expect(isStructuredValue({})).toBe(true);
    expect(isStructuredValue([])).toBe(true);
    expect(isStructuredValue(null)).toBe(false);
    expect(isStructuredValue("x")).toBe(false);
  });
});
