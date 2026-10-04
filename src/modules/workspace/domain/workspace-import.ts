/** Target settings an import may overwrite; the backend leaves them untouched unless named. */
export const IMPORT_SETTINGS = ["palette", "sla", "description", "branding"] as const;
export type ImportSetting = (typeof IMPORT_SETTINGS)[number];

/** Sections of an export worth announcing before the import, in display order. */
export const IMPORT_FILE_SECTIONS = [
  "tickets", "comments", "users", "categories", "organizations", "departments", "projects", "kbArticles",
  "customFields", "cannedResponses",
] as const;
export type ImportFileSection = (typeof IMPORT_FILE_SECTIONS)[number];

/** Minimum length the server accepts for an export password. */
export const EXPORT_PASSWORD_MIN = 12;
export const EXPORT_PASSWORD_MAX = 256;

/** Counters of an ImportResult, in display order. commentsSkipped is reported apart, as a warning. */
export const IMPORT_RESULT_COUNTERS = [
  "ticketsImported", "commentsImported", "usersCreated", "membersAdded", "categoriesImported", "tagsImported",
  "organizationsImported", "departmentsImported", "projectsImported", "descriptionEditsImported",
  "commentEditsImported", "attachmentsImported", "participantsImported", "cannedResponsesImported",
  "customFieldsImported", "csatResponsesImported", "kbCategoriesImported", "kbArticlesImported", "auditLogImported",
] as const;
export type ImportResultCounter = (typeof IMPORT_RESULT_COUNTERS)[number];

/** What the server read from an export, before importing it. */
export interface ImportPreview {
  version: number | string;
  counts: Partial<Record<ImportFileSection, number>>;
  settings: {
    palette: string | null;
    sla: boolean;
    description: string | null;
    branding: { appName: string | null; appSubtitle: string | null } | null;
  };
}

export type ExportPasswordProblem = "tooShort" | "tooLong" | "mismatch";

/** Why a new export password cannot be used yet, or null when it can. */
export function exportPasswordProblem(password: string, confirmation: string): ExportPasswordProblem | null {
  if (password.length < EXPORT_PASSWORD_MIN) return "tooShort";
  if (password.length > EXPORT_PASSWORD_MAX) return "tooLong";
  if (password !== confirmation) return "mismatch";
  return null;
}

/** File name a Content-Disposition header announces, or the fallback when it names none. */
export function filenameFromDisposition(header: string | null | undefined, fallback: string): string {
  if (!header) return fallback;
  let name = "";
  const encoded = /filename\*\s*=\s*[^']*''([^;]+)/i.exec(header);
  if (encoded) {
    try {
      name = decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ""));
    } catch { /* malformed encoding: fall back to the plain parameter */ }
  }
  if (!name) {
    const plain = /filename\s*=\s*(?:"([^"]*)"|([^;]+))/i.exec(header);
    name = (plain?.[1] ?? plain?.[2] ?? "").trim();
  }
  // Never let a header pick a path
  const base = name.split(/[\\/]/).pop()?.trim() ?? "";
  return base || fallback;
}

/** The non-empty sections of a preview, in display order. */
export function previewSections(preview: ImportPreview): { section: ImportFileSection; count: number }[] {
  return IMPORT_FILE_SECTIONS
    .map((section) => ({ section, count: preview.counts?.[section] ?? 0 }))
    .filter(({ count }) => count > 0);
}

const nonEmpty = (value: string | null | undefined): value is string => !!value && !!value.trim();

/**
 * Settings worth offering to overwrite: those the export holds a value for. An empty value is
 * not offered, since overwriting would only blank the target's own.
 */
export function offeredSettings(settings: ImportPreview["settings"] | undefined): ImportSetting[] {
  if (!settings) return [];
  return IMPORT_SETTINGS.filter((key) => {
    if (key === "palette") return nonEmpty(settings.palette);
    if (key === "sla") return settings.sla === true;
    if (key === "description") return nonEmpty(settings.description);
    return !!settings.branding && (nonEmpty(settings.branding.appName) || nonEmpty(settings.branding.appSubtitle));
  });
}

/** One-line preview of incoming branding: "appName · appSubtitle", skipping what is empty. */
export function brandingText(branding: ImportPreview["settings"]["branding"]): string {
  if (!branding) return "";
  return [branding.appName, branding.appSubtitle].filter(nonEmpty).join(" · ");
}

/** Value of the `overwrite` query param, or undefined so the param is left out entirely. */
export function overwriteParam(selected: Iterable<ImportSetting>): string | undefined {
  const chosen = new Set(selected);
  const keys = IMPORT_SETTINGS.filter((key) => chosen.has(key));
  return keys.length ? keys.join(",") : undefined;
}

/** The counters of an import result worth reporting: those above zero, in display order. */
export function summarizeImportResult(
  result: Partial<Record<ImportResultCounter, number>>,
): { counter: ImportResultCounter; count: number }[] {
  return IMPORT_RESULT_COUNTERS
    .map((counter) => ({ counter, count: result[counter] ?? 0 }))
    .filter(({ count }) => count > 0);
}

export function truncateText(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}
