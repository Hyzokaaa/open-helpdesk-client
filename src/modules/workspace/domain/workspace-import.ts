/** Target settings an import may overwrite; the backend leaves them untouched unless named. */
export const IMPORT_SETTINGS = ["palette", "sla", "description", "branding"] as const;
export type ImportSetting = (typeof IMPORT_SETTINGS)[number];

/** Sections of an export worth announcing before the import, in display order. */
export const IMPORT_FILE_SECTIONS = [
  "tickets", "comments", "users", "categories", "organizations", "departments", "projects", "kbArticles",
  "customFields", "cannedResponses", "attachments",
] as const;
export type ImportFileSection = (typeof IMPORT_FILE_SECTIONS)[number];

/** Minimum length the server accepts for an export password. */
export const EXPORT_PASSWORD_MIN = 12;
export const EXPORT_PASSWORD_MAX = 256;

/** Counters of an ImportResult, in display order. The *Skipped counters are reported apart, as warnings. */
export const IMPORT_RESULT_COUNTERS = [
  "ticketsImported", "commentsImported", "usersCreated", "membersAdded", "categoriesImported", "tagsImported",
  "organizationsImported", "departmentsImported", "projectsImported", "descriptionEditsImported",
  "commentEditsImported", "attachmentsImported", "participantsImported", "cannedResponsesImported",
  "customFieldsImported", "csatResponsesImported", "kbCategoriesImported", "kbArticlesImported", "auditLogImported",
] as const;
export type ImportResultCounter = (typeof IMPORT_RESULT_COUNTERS)[number];

/** Counters of an ImportResult that mean something was left out; shown as warnings. */
export const IMPORT_RESULT_WARNINGS = ["commentsSkipped", "attachmentsSkipped"] as const;
export type ImportResultWarning = (typeof IMPORT_RESULT_WARNINGS)[number];

/** Incoming branding: texts, and whether the export carries a logo and an icon file. */
export interface ImportBranding {
  appName: string | null;
  appSubtitle: string | null;
  logo?: boolean;
  icon?: boolean;
}

/** What the server read from an export, before importing it. */
export interface ImportPreview {
  version: number | string;
  /** Records per section; `files` and `filesBytes` count the files (attachments, logos) the archive holds. */
  counts: Partial<Record<ImportFileSection | "files" | "filesBytes", number>>;
  settings: {
    palette: string | null;
    sla: boolean;
    description: string | null;
    branding: ImportBranding | null;
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
    const b = settings.branding;
    return !!b && (nonEmpty(b.appName) || nonEmpty(b.appSubtitle) || b.logo === true || b.icon === true);
  });
}

/**
 * One-line preview of incoming branding: "appName · appSubtitle · logo · icon", skipping what is
 * empty; `labels` are the (translated) words for a carried logo and icon.
 */
export function brandingText(
  branding: ImportPreview["settings"]["branding"],
  labels: { logo: string; icon: string } = { logo: "logo", icon: "icon" },
): string {
  if (!branding) return "";
  return [
    branding.appName,
    branding.appSubtitle,
    branding.logo === true ? labels.logo : null,
    branding.icon === true ? labels.icon : null,
  ].filter(nonEmpty).join(" · ");
}

/** A byte count for people: "512 B", "1.5 KB", "34.5 MB", "2.1 GB" (powers of 1024). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  if (unit === 0) return `${Math.round(value)} B`;
  const rounded = value >= 100 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, "");
  return `${rounded} ${units[unit]}`;
}

/** The files an export carries, or null when it carries none (e.g. an older export). */
export function previewFiles(preview: ImportPreview): { files: number; bytes: number } | null {
  const files = preview.counts?.files ?? 0;
  if (files <= 0) return null;
  return { files, bytes: preview.counts?.filesBytes ?? 0 };
}

/** Whole percentage of a transfer, or null when its total is unknown. */
export function transferPercent(loaded: number, total: number | undefined): number | null {
  if (!total || total <= 0) return null;
  return Math.min(100, Math.max(0, Math.floor((loaded / total) * 100)));
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

/** What an import left out, above zero, in display order. */
export function importWarnings(
  result: Partial<Record<ImportResultWarning, number>>,
): { warning: ImportResultWarning; count: number }[] {
  return IMPORT_RESULT_WARNINGS
    .map((warning) => ({ warning, count: result[warning] ?? 0 }))
    .filter(({ count }) => count > 0);
}

export function truncateText(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}
