import { describe, expect, it } from "vitest";
import { formatCustomFieldValue } from "./format-custom-field-value";

const t = (key: string) => ({ "common.yes": "Sí", "common.no": "No" })[key] ?? key;

describe("formatCustomFieldValue", () => {
  it("reads a checkbox as yes or no", () => {
    expect(formatCustomFieldValue("checkbox", true, t)).toBe("Sí");
    expect(formatCustomFieldValue("checkbox", false, t)).toBe("No");
  });

  it("puts a date in the reader's order", () => {
    expect(formatCustomFieldValue("date", "2026-10-14", t)).toBe("14/10/2026");
    expect(formatCustomFieldValue("date", "2026-10-14", t, "MM/DD/YYYY")).toBe("10/14/2026");
  });

  it("joins several options and leaves text as it is", () => {
    expect(formatCustomFieldValue("multi-select", ["Madrid", "Remoto"], t)).toBe("Madrid, Remoto");
    expect(formatCustomFieldValue("text", "PC-MAD-0423", t)).toBe("PC-MAD-0423");
    expect(formatCustomFieldValue("number", 12, t)).toBe("12");
  });
});
