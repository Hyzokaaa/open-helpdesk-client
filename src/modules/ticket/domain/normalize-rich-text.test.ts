import { describe, it, expect } from "vitest";
import { isSameRichText, normalizeRichText, summarizeRichText } from "./normalize-rich-text";

describe("normalizeRichText", () => {
  it("wraps bare text in a paragraph like the editor does", () => {
    expect(normalizeRichText("Prueba")).toBe("<p>Prueba</p>");
  });

  it("collapses line breaks and escapes ampersands in bare text", () => {
    expect(normalizeRichText("Line one\nLine two & more")).toBe("<p>Line one Line two &amp; more</p>");
  });

  it("leaves markup untouched", () => {
    expect(normalizeRichText("<p>Hello</p><p>World</p>")).toBe("<p>Hello</p><p>World</p>");
  });

  it("treats empty values as empty", () => {
    expect(normalizeRichText(null)).toBe("");
    expect(normalizeRichText("  ")).toBe("");
  });
});

describe("isSameRichText", () => {
  it("considers imported plain text equal to what the editor returns for it", () => {
    expect(isSameRichText("<p>Hi team, the printer &amp; scanner fail</p>", "Hi team,\nthe printer & scanner fail")).toBe(true);
  });

  it("detects real changes", () => {
    expect(isSameRichText("<p>Prueba editada</p>", "Prueba")).toBe(false);
    expect(isSameRichText("<p><strong>Prueba</strong></p>", "<p>Prueba</p>")).toBe(false);
  });

  it("treats null and empty as the same", () => {
    expect(isSameRichText(null, "")).toBe(true);
  });
});

describe("summarizeRichText", () => {
  it("strips tags and decodes entities", () => {
    expect(summarizeRichText("<p>One</p><p>Two &amp; three</p>")).toBe("One Two & three");
  });

  it("truncates long text", () => {
    expect(summarizeRichText("a".repeat(60), 50)).toBe(`${"a".repeat(50)}...`);
  });

  it("shows a dash for empty content", () => {
    expect(summarizeRichText("")).toBe("—");
  });
});
