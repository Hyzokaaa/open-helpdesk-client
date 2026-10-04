import { describe, expect, it } from "vitest";
import {
  brandingText,
  exportPasswordProblem,
  filenameFromDisposition,
  ImportPreview,
  offeredSettings,
  overwriteParam,
  previewSections,
  summarizeImportResult,
  truncateText,
} from "./workspace-import";

const preview = (over: Partial<ImportPreview> = {}): ImportPreview => ({
  version: 2,
  counts: {},
  settings: { palette: null, sla: false, description: null, branding: null },
  ...over,
});

describe("exportPasswordProblem", () => {
  it("asks for at least 12 characters before comparing", () => {
    expect(exportPasswordProblem("short", "short")).toBe("tooShort");
    expect(exportPasswordProblem("a".repeat(11), "b")).toBe("tooShort");
  });

  it("rejects a password longer than the server accepts", () => {
    const long = "a".repeat(257);
    expect(exportPasswordProblem(long, long)).toBe("tooLong");
  });

  it("requires the confirmation to match", () => {
    expect(exportPasswordProblem("a".repeat(12), "a".repeat(13))).toBe("mismatch");
    expect(exportPasswordProblem("a".repeat(12), "a".repeat(12))).toBeNull();
    expect(exportPasswordProblem("a".repeat(256), "a".repeat(256))).toBeNull();
  });
});

describe("filenameFromDisposition", () => {
  it("reads quoted and bare filenames", () => {
    expect(filenameFromDisposition('attachment; filename="acme-2026-10-04.ohd"', "acme.ohd")).toBe("acme-2026-10-04.ohd");
    expect(filenameFromDisposition("attachment; filename=acme-2026-10-04.ohd", "acme.ohd")).toBe("acme-2026-10-04.ohd");
  });

  it("prefers the RFC 5987 encoded name", () => {
    expect(filenameFromDisposition(
      "attachment; filename=\"x.ohd\"; filename*=UTF-8''caf%C3%A9-2026-10-04.ohd", "f.ohd",
    )).toBe("café-2026-10-04.ohd");
  });

  it("falls back when the header is missing or names nothing usable", () => {
    expect(filenameFromDisposition(undefined, "acme.ohd")).toBe("acme.ohd");
    expect(filenameFromDisposition("attachment", "acme.ohd")).toBe("acme.ohd");
    expect(filenameFromDisposition('attachment; filename=""', "acme.ohd")).toBe("acme.ohd");
  });

  it("drops any directory part", () => {
    expect(filenameFromDisposition('attachment; filename="../../etc/x.ohd"', "f.ohd")).toBe("x.ohd");
    expect(filenameFromDisposition('attachment; filename="..\\x.ohd"', "f.ohd")).toBe("x.ohd");
  });
});

describe("previewSections", () => {
  it("lists the non-empty sections in display order", () => {
    expect(previewSections(preview({
      counts: { users: 2, tickets: 3, organizations: 0, kbArticles: 1, cannedResponses: 4 },
    }))).toEqual([
      { section: "tickets", count: 3 },
      { section: "users", count: 2 },
      { section: "kbArticles", count: 1 },
      { section: "cannedResponses", count: 4 },
    ]);
  });

  it("is empty for an export without records", () => {
    expect(previewSections(preview())).toEqual([]);
  });
});

describe("offeredSettings", () => {
  it("offers every setting the export holds a value for, in a stable order", () => {
    expect(offeredSettings({
      palette: "blue", sla: true, description: "Support desk", branding: { appName: "Acme Help", appSubtitle: null },
    })).toEqual(["palette", "sla", "description", "branding"]);
  });

  it("does not offer settings that are missing, null or blank", () => {
    expect(offeredSettings({
      palette: "", sla: false, description: "  ", branding: { appName: null, appSubtitle: " " },
    })).toEqual([]);
    expect(offeredSettings(preview().settings)).toEqual([]);
    expect(offeredSettings(undefined)).toEqual([]);
  });
});

describe("brandingText", () => {
  it("joins what is set with a middle dot", () => {
    expect(brandingText({ appName: "Acme", appSubtitle: "Help" })).toBe("Acme · Help");
    expect(brandingText({ appName: null, appSubtitle: "Help" })).toBe("Help");
    expect(brandingText(null)).toBe("");
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
