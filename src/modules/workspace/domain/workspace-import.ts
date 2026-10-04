/** Target settings an import may overwrite; the backend leaves them untouched unless named. */
export const IMPORT_SETTINGS = ["palette", "sla", "description", "branding"] as const;
export type ImportSetting = (typeof IMPORT_SETTINGS)[number];

/** Sections of an export file worth announcing before the import, in display order. */
export const IMPORT_FILE_SECTIONS = [
  "tickets", "comments", "users", "categories", "organizations", "departments", "projects", "kbArticles",
] as const;
export type ImportFileSection = (typeof IMPORT_FILE_SECTIONS)[number];

/** Counters of an ImportResult, in display order. commentsSkipped is reported apart, as a warning. */
export const IMPORT_RESULT_COUNTERS = [
  "ticketsImported", "commentsImported", "usersCreated", "membersAdded", "categoriesImported", "tagsImported",
  "organizationsImported", "departmentsImported", "projectsImported", "descriptionEditsImported",
  "commentEditsImported", "attachmentsImported", "participantsImported", "cannedResponsesImported",
  "customFieldsImported", "csatResponsesImported", "kbCategoriesImported", "kbArticlesImported", "auditLogImported",
] as const;
export type ImportResultCounter = (typeof IMPORT_RESULT_COUNTERS)[number];

/** Incoming value of each setting the file carries; a setting the file lacks is absent. */
export interface ImportFileSettings {
  palette?: string;
  sla?: true;
  description?: string;
  branding?: { appName: string | null; appSubtitle: string | null };
}

export interface ImportFilePreview {
  sections: { section: ImportFileSection; count: number }[];
  settings: ImportFileSettings;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nonEmptyText = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

/**
 * What an export file brings: the non-empty sections and the settings it holds a value for.
 * A setting whose value is null or empty is not offered, since overwriting would only blank
 * the target's own value.
 */
export function previewImportFile(data: unknown): ImportFilePreview {
  const file = isObject(data) ? data : {};
  const sections = IMPORT_FILE_SECTIONS
    .map((section) => ({ section, count: Array.isArray(file[section]) ? (file[section] as unknown[]).length : 0 }))
    .filter(({ count }) => count > 0);

  const settings: ImportFileSettings = {};
  const ws = isObject(file.workspace) ? file.workspace : {};
  const palette = isObject(ws.metadata) ? nonEmptyText(ws.metadata.palette) : null;
  if (palette) settings.palette = palette;
  if (isObject(ws.slaPolicy)) settings.sla = true;
  const description = nonEmptyText(ws.description);
  if (description) settings.description = description;
  const appName = nonEmptyText(ws.appName);
  const appSubtitle = nonEmptyText(ws.appSubtitle);
  if (appName || appSubtitle) settings.branding = { appName, appSubtitle };

  return { sections, settings };
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
