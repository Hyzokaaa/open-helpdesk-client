import { describe, expect, it } from "vitest";
import { overwriteParam, previewImportFile, summarizeImportResult, truncateText } from "./workspace-import";

describe("previewImportFile", () => {
  it("offers every setting the file holds a value for", () => {
    const preview = previewImportFile({
      workspace: {
        name: "Acme",
        description: "Support desk",
        slaPolicy: { high: 4 },
        metadata: { palette: "blue", other: 1 },
        appName: "Acme Help",
        appSubtitle: null,
      },
    });
    expect(preview.settings).toEqual({
      palette: "blue",
      sla: true,
      description: "Support desk",
      branding: { appName: "Acme Help", appSubtitle: null },
    });
  });

  it("does not offer settings that are missing, null or empty", () => {
    const preview = previewImportFile({
      workspace: { name: "Old", description: "  ", slaPolicy: null, metadata: { palette: null } },
    });
    expect(preview.settings).toEqual({});
  });

  it("copes with an older file without appName or appSubtitle and with a file without workspace", () => {
    expect(previewImportFile({ workspace: { metadata: null } }).settings).toEqual({});
    expect(previewImportFile({}).settings).toEqual({});
    expect(previewImportFile(null)).toEqual({ sections: [], settings: {} });
  });

  it("lists the non-empty sections in display order", () => {
    const preview = previewImportFile({
      users: [{}, {}],
      tickets: [{}, {}, {}],
      organizations: [],
      kbArticles: [{}],
      projects: "not a list",
    });
    expect(preview.sections).toEqual([
      { section: "tickets", count: 3 },
      { section: "users", count: 2 },
      { section: "kbArticles", count: 1 },
    ]);
  });
});

describe("overwriteParam", () => {
  it("is undefined when nothing is selected, so the param is omitted", () => {
    expect(overwriteParam([])).toBeUndefined();
  });

  it("joins the selected keys in a stable order without duplicates", () => {
    expect(overwriteParam(["branding", "palette", "branding"])).toBe("palette,branding");
    expect(overwriteParam(new Set(["sla", "description"] as const))).toBe("sla,description");
  });
});

describe("summarizeImportResult", () => {
  it("keeps the counters above zero in display order, including the new ones", () => {
    expect(summarizeImportResult({
      usersCreated: 2, ticketsImported: 10, tagsImported: 0, kbArticlesImported: 3, organizationsImported: 1,
    })).toEqual([
      { counter: "ticketsImported", count: 10 },
      { counter: "usersCreated", count: 2 },
      { counter: "organizationsImported", count: 1 },
      { counter: "kbArticlesImported", count: 3 },
    ]);
  });

  it("treats counters a server omits as zero", () => {
    expect(summarizeImportResult({})).toEqual([]);
  });
});

describe("truncateText", () => {
  it("collapses whitespace and cuts long text with an ellipsis", () => {
    expect(truncateText("a  b\nc", 10)).toBe("a b c");
    expect(truncateText("abcdefghij", 5)).toBe("abcd…");
  });
});
