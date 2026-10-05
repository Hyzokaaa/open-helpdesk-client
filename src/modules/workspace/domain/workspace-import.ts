/**
 * Target settings an import may overwrite; the backend leaves them untouched unless named. The
 * order is the order of the `overwrite` param.
 */
export const IMPORT_SETTINGS = [
  "palette", "sla", "description", "branding", "name", "emailSender", "customDomain",
] as const;
export type ImportSetting = (typeof IMPORT_SETTINGS)[number];

/** Sections of an export worth announcing before the import, in display order. */
export const IMPORT_FILE_SECTIONS = [
  "tickets", "comments", "users", "categories", "organizations", "departments", "projects", "kbArticles",
  "customFields", "cannedResponses", "mailboxes", "emailRules", "webhooks", "attachments",
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
  "mailboxesImported", "emailRulesImported", "webhooksImported",
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

/** Incoming custom email sender: its address, and whether the export carries its password. */
export interface ImportEmailSender {
  fromAddress: string | null;
  hasCredentials: boolean;
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
    /** Absent in exports from servers that did not migrate these settings yet */
    name?: string | null;
    emailSender?: ImportEmailSender | null;
    customDomain?: string | null;
    /** Whether another workspace of this installation already uses that custom domain (the import would skip it) */
    customDomainConflict?: boolean;
  };
  /** Whether the export carries mailbox and sender passwords and webhook secrets */
  credentialsIncluded?: boolean;
}

/** Whether the file's custom domain is taken by another workspace here, so importing it would be skipped. */
export function hasCustomDomainConflict(settings: ImportPreview["settings"] | null | undefined): boolean {
  return !!settings && settings.customDomainConflict === true && !!settings.customDomain?.trim();
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
    if (key === "name") return nonEmpty(settings.name);
    if (key === "emailSender") return nonEmpty(settings.emailSender?.fromAddress);
    if (key === "customDomain") return nonEmpty(settings.customDomain);
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

/**
 * Tickets the import left as they were because the workspace already had them, and the files
 * those tickets carried; null when there were none. Not a warning: nothing was lost or overwritten.
 */
export function alreadyPresentNotice(
  result: { ticketsAlreadyPresent?: number; attachmentsOfExistingTickets?: number },
): { tickets: number; attachments: number } | null {
  const tickets = result.ticketsAlreadyPresent ?? 0;
  if (tickets <= 0) return null;
  return { tickets, attachments: Math.max(0, result.attachmentsOfExistingTickets ?? 0) };
}

/**
 * Tickets the workspace already had that the import completed with what they lacked; null when
 * none was. Not a warning either: only empty fields were filled and missing items added.
 */
export function completedNotice(result: { ticketsCompleted?: number }): { tickets: number } | null {
  const tickets = result.ticketsCompleted ?? 0;
  return tickets > 0 ? { tickets } : null;
}

/** Value of the `completeExisting` query param, or undefined so the param is left out entirely. */
export function completeExistingParam(enabled: boolean): "true" | undefined {
  return enabled ? "true" : undefined;
}

export type PreviewWarning = "mailboxesPaused" | "credentialsMissing";

/**
 * What to tell the admin before importing: mailboxes arrive paused and must be stopped at the
 * source, and passwords and secrets the file does not carry must be entered again.
 */
export function previewWarnings(preview: ImportPreview): PreviewWarning[] {
  const warnings: PreviewWarning[] = [];
  const mailboxes = preview.counts?.mailboxes ?? 0;
  const webhooks = preview.counts?.webhooks ?? 0;
  if (mailboxes > 0) warnings.push("mailboxesPaused");
  const needsSecrets = mailboxes > 0 || webhooks > 0 || nonEmpty(preview.settings?.emailSender?.fromAddress);
  if (needsSecrets && preview.credentialsIncluded !== true) warnings.push("credentialsMissing");
  return warnings;
}

export type ResultNotice =
  | "mailboxesPaused" | "webhooksDisabled" | "customDomainUnverified" | "customDomainSkipped"
  | "credentialsMissing" | "emailSenderNotApplied" | "apiKeysNotMigrated";

/**
 * What the admin still has to do after an import, in display order. The API keys notice is
 * always last and always present: keys are never migrated.
 */
export function resultNotices(result: {
  mailboxesImported?: number;
  webhooksImported?: number;
  settingsApplied?: readonly ImportSetting[];
  customDomainSkipped?: string | null;
  credentialsIncluded?: boolean;
}, requested: readonly ImportSetting[] = []): ResultNotice[] {
  const notices: ResultNotice[] = [];
  const mailboxes = result.mailboxesImported ?? 0;
  const webhooks = result.webhooksImported ?? 0;
  const applied = result.settingsApplied ?? [];
  if (mailboxes > 0) notices.push("mailboxesPaused");
  if (webhooks > 0) notices.push("webhooksDisabled");
  if (applied.includes("customDomain")) notices.push("customDomainUnverified");
  if (nonEmpty(result.customDomainSkipped)) notices.push("customDomainSkipped");
  const needsSecrets = mailboxes > 0 || webhooks > 0 || applied.includes("emailSender");
  if (needsSecrets && result.credentialsIncluded !== true) notices.push("credentialsMissing");
  // The server skips a sender without its password: applying it would stop all mail from the workspace
  if (requested.includes("emailSender") && !applied.includes("emailSender")) notices.push("emailSenderNotApplied");
  notices.push("apiKeysNotMigrated");
  return notices;
}

export function truncateText(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}
