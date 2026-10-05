import { describe, expect, it } from "vitest";
import {
  brandingText,
  exportPasswordProblem,
  filenameFromDisposition,
  formatBytes,
  ImportPreview,
  alreadyPresentNotice,
  completedNotice,
  completeExistingParam,
  importWarnings,
  offeredSettings,
  overwriteParam,
  previewFiles,
  previewSections,
  summarizeImportResult,
  transferPercent,
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
      counts: { users: 2, tickets: 3, organizations: 0, kbArticles: 1, cannedResponses: 4, attachments: 5, files: 6, filesBytes: 99 },
    }))).toEqual([
      { section: "tickets", count: 3 },
      { section: "users", count: 2 },
      { section: "kbArticles", count: 1 },
      { section: "cannedResponses", count: 4 },
      { section: "attachments", count: 5 },
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

  it("offers branding when the export only carries a logo or an icon", () => {
    const settings = preview().settings;
    expect(offeredSettings({ ...settings, branding: { appName: null, appSubtitle: null, logo: true, icon: false } }))
      .toEqual(["branding"]);
    expect(offeredSettings({ ...settings, branding: { appName: null, appSubtitle: null, logo: false, icon: true } }))
      .toEqual(["branding"]);
    expect(offeredSettings({ ...settings, branding: { appName: null, appSubtitle: null, logo: false, icon: false } }))
      .toEqual([]);
  });
});

describe("brandingText", () => {
  it("joins what is set with a middle dot", () => {
    expect(brandingText({ appName: "Acme", appSubtitle: "Help" })).toBe("Acme · Help");
    expect(brandingText({ appName: null, appSubtitle: "Help" })).toBe("Help");
    expect(brandingText(null)).toBe("");
  });

  it("mentions a carried logo and icon with the given labels", () => {
    const labels = { logo: "logo included", icon: "icon included" };
    expect(brandingText({ appName: "Acme", appSubtitle: null, logo: true, icon: true }, labels))
      .toBe("Acme · logo included · icon included");
    expect(brandingText({ appName: null, appSubtitle: null, logo: false, icon: true }, labels)).toBe("icon included");
    expect(brandingText({ appName: "Acme", appSubtitle: null, logo: false, icon: false }, labels)).toBe("Acme");
  });
});

describe("formatBytes", () => {
  it("picks a readable unit with at most one decimal", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
    expect(formatBytes(34.5 * 1024 * 1024)).toBe("34.5 MB");
    expect(formatBytes(250 * 1024 * 1024)).toBe("250 MB");
    expect(formatBytes(2.1 * 1024 ** 3)).toBe("2.1 GB");
  });

  it("treats invalid sizes as zero", () => {
    expect(formatBytes(-1)).toBe("0 B");
    expect(formatBytes(Number.NaN)).toBe("0 B");
  });
});

describe("previewFiles", () => {
  it("reports the files and their total size", () => {
    expect(previewFiles(preview({ counts: { files: 12, filesBytes: 2048 } }))).toEqual({ files: 12, bytes: 2048 });
  });

  it("is null for an export without files, such as an older one", () => {
    expect(previewFiles(preview())).toBeNull();
    expect(previewFiles(preview({ counts: { attachments: 3, files: 0 } }))).toBeNull();
  });
});

describe("transferPercent", () => {
  it("is a whole percentage capped at 100", () => {
    expect(transferPercent(1, 3)).toBe(33);
    expect(transferPercent(5, 5)).toBe(100);
    expect(transferPercent(6, 5)).toBe(100);
  });

  it("is null when the total is unknown", () => {
    expect(transferPercent(10, undefined)).toBeNull();
    expect(transferPercent(10, 0)).toBeNull();
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

describe("importWarnings", () => {
  it("reports skipped comments and attachments above zero, in order", () => {
    expect(importWarnings({ attachmentsSkipped: 4, commentsSkipped: 1 })).toEqual([
      { warning: "commentsSkipped", count: 1 },
      { warning: "attachmentsSkipped", count: 4 },
    ]);
    expect(importWarnings({ attachmentsSkipped: 2, commentsSkipped: 0 })).toEqual([
      { warning: "attachmentsSkipped", count: 2 },
    ]);
  });

  it("is empty when nothing was left out or the server omits the counters", () => {
    expect(importWarnings({})).toEqual([]);
  });
});

describe("alreadyPresentNotice", () => {
  it("reports tickets already present and the attachments they carried", () => {
    expect(alreadyPresentNotice({ ticketsAlreadyPresent: 8, attachmentsOfExistingTickets: 2 })).toEqual({ tickets: 8, attachments: 2 });
    expect(alreadyPresentNotice({ ticketsAlreadyPresent: 3 })).toEqual({ tickets: 3, attachments: 0 });
  });

  it("is null when no ticket was already present or the server omits the counters", () => {
    expect(alreadyPresentNotice({ ticketsAlreadyPresent: 0, attachmentsOfExistingTickets: 0 })).toBeNull();
    expect(alreadyPresentNotice({})).toBeNull();
  });

  it("is not counted among the warnings or the imported counters", () => {
    const result = { ticketsAlreadyPresent: 5, attachmentsOfExistingTickets: 1 };
    expect(importWarnings(result as never)).toEqual([]);
    expect(summarizeImportResult(result as never)).toEqual([]);
  });
});

describe("completedNotice", () => {
  it("reports the tickets the import completed", () => {
    expect(completedNotice({ ticketsCompleted: 4 })).toEqual({ tickets: 4 });
  });

  it("is null when none was completed or the server omits the counter", () => {
    expect(completedNotice({ ticketsCompleted: 0 })).toBeNull();
    expect(completedNotice({})).toBeNull();
  });

  it("is reported apart from the warnings, the imported counters and the already-present notice", () => {
    const result = { ticketsCompleted: 2, ticketsAlreadyPresent: 0 };
    expect(importWarnings(result as never)).toEqual([]);
    expect(summarizeImportResult(result as never)).toEqual([]);
    expect(alreadyPresentNotice(result)).toBeNull();
  });
});

describe("completeExistingParam", () => {
  it("sends true only when ticked, and leaves the param out otherwise", () => {
    expect(completeExistingParam(true)).toBe("true");
    expect(completeExistingParam(false)).toBeUndefined();
  });
});

describe("truncateText", () => {
  it("collapses whitespace and cuts long text with an ellipsis", () => {
    expect(truncateText("a  b\nc", 10)).toBe("a b c");
    expect(truncateText("abcdefghij", 5)).toBe("abcd…");
  });
});
