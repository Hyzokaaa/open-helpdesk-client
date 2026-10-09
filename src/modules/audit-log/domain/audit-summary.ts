import { formatInlineValue, isStructuredValue } from "./audit-metadata";

/**
 * Pure helpers that turn stored audit metadata into text people can read: comment HTML into a
 * plain preview, ticket field keys into translated names and reference ids into the names they
 * stood for. Older entries hold raw HTML and bare ids; newer ones carry plain text and labels.
 */

type Translate = (key: string) => string;

/** The markup mentions are stored in: `@[Display Name](userId)`. */
const MENTION_MARKUP = /@\[([^\]]+)\]\([^)]+\)/g;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

/** Decodes the named entities rich text commonly holds and any numeric one. */
function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    const lower = code.toLowerCase();
    if (lower in ENTITIES) return ENTITIES[lower];
    if (lower.startsWith("#x")) return safeFromCodePoint(parseInt(lower.slice(2), 16), match);
    if (lower.startsWith("#")) return safeFromCodePoint(parseInt(lower.slice(1), 10), match);
    return match;
  });
}

function safeFromCodePoint(code: number, fallback: string): string {
  try {
    return Number.isFinite(code) ? String.fromCodePoint(code) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Reduces rich text to one readable line: mentions read as `@Name`, block boundaries and line
 * breaks become spaces, every tag is removed, entities are decoded and whitespace collapses.
 */
export function htmlToText(input: string): string {
  return decodeEntities(
    input
      .replace(MENTION_MARKUP, "@$1")
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/?(p|div|li|ul|ol|h[1-6]|blockquote|pre|tr|td|th|table)\b[^>]*>/gi, " ")
      .replace(/<[a-z/!][^>]*>?/gi, ""),
  )
    .replace(/\s+/g, " ")
    .trim();
}

/** A comment's preview for the audit log, from plain text (new entries) or raw HTML (old ones). */
export function commentPreview(content: unknown, maxLength = 50): string {
  if (typeof content !== "string") return "";
  const text = htmlToText(content);
  return text.length > maxLength ? text.slice(0, maxLength).trimEnd() + "..." : text;
}

/** Whether a value looks like a ULID, which must never be shown to people as a value. */
export function isUlid(value: unknown): boolean {
  return typeof value === "string" && /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(value);
}

/** Ticket fields that point at another record, resolved through workspace data. */
export const REFERENCE_FIELDS = ["categoryId", "departmentId", "organizationId", "projectId", "tagIds"] as const;
export type ReferenceField = (typeof REFERENCE_FIELDS)[number];

/** Names by id for each kind of reference; a field left out was not loaded (no access, or no workspace). */
export type ReferenceNames = Partial<Record<ReferenceField, Map<string, string>>>;

const FIELD_KEYS: Record<string, string> = {
  name: "auditLog.field.name",
  priority: "auditLog.field.priority",
  categoryId: "auditLog.field.categoryId",
  departmentId: "auditLog.field.departmentId",
  organizationId: "auditLog.field.organizationId",
  projectId: "auditLog.field.projectId",
  tagIds: "auditLog.field.tagIds",
  provider: "auditLog.field.provider",
  serverUrl: "auditLog.field.serverUrl",
  siteId: "auditLog.field.siteId",
  useCookies: "auditLog.field.useCookies",
  trackEvents: "auditLog.field.trackEvents",
  shareWithInstallation: "auditLog.field.shareWithInstallation",
  description: "auditLog.field.description",
  slug: "auditLog.field.slug",
  color: "auditLog.field.color",
  title: "auditLog.field.title",
  icon: "auditLog.field.icon",
  status: "auditLog.field.status",
  options: "auditLog.field.options",
  required: "auditLog.field.required",
  isActive: "auditLog.field.isActive",
  events: "auditLog.field.events",
  host: "auditLog.field.host",
  role: "auditLog.field.role",
  slaPolicy: "auditLog.field.slaPolicy",
  smtpHost: "auditLog.field.smtpHost",
  smtpPort: "auditLog.field.smtpPort",
  smtpUser: "auditLog.field.smtpUser",
  smtpFrom: "auditLog.field.smtpFrom",
  encryption: "auditLog.field.encryption",
  fromName: "auditLog.field.fromName",
  fromEmail: "auditLog.field.fromEmail",
  selfService: "auditLog.field.selfService",
  upgradeEnabled: "auditLog.field.upgradeEnabled",
  upgradeEmail: "auditLog.field.upgradeEmail",
  upgradeInApp: "auditLog.field.upgradeInApp",
  planId: "auditLog.field.planId",
  billingCycle: "auditLog.field.billingCycle",
  extraSeats: "auditLog.field.extraSeats",
  gateway: "auditLog.field.gateway",
  conditions: "auditLog.field.conditions",
  actions: "auditLog.field.actions",
  mailboxIds: "auditLog.field.mailboxIds",
  assignee: "auditLog.field.assignee",
  palette: "auditLog.field.palette",
  systemMailboxEnabled: "auditLog.field.systemMailboxEnabled",
  to: "auditLog.field.to",
  subject: "auditLog.field.subject",
  type: "auditLog.field.type",
  via: "auditLog.field.via",
  reason: "auditLog.field.reason",
  error: "auditLog.field.error",
  errorCode: "auditLog.field.errorCode",
  ticketId: "auditLog.field.ticketId",
  ticketReference: "auditLog.field.ticketReference",
  ticketName: "auditLog.field.ticketName",
  email: "auditLog.field.email",
  emailSent: "auditLog.field.emailSent",
  count: "auditLog.field.count",
  invitations: "auditLog.field.invitations",
  defaultLanguage: "auditLog.field.defaultLanguage",
};

/** The translated name of a changed field; fields without a translation keep their key. */
export function fieldLabel(field: string, t: Translate): string {
  const key = FIELD_KEYS[field];
  return key ? t(key) : field;
}

function isReferenceField(field: string): field is ReferenceField {
  return (REFERENCE_FIELDS as readonly string[]).includes(field);
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

/** One referenced id as a name: from the loaded data, else deleted when the data was loaded, else unavailable. */
export function resolveReference(field: ReferenceField, id: string, names: ReferenceNames, t: Translate): string {
  const map = names[field];
  if (!map) return t("auditLog.value.unavailable");
  return map.get(id) ?? t("auditLog.value.deleted");
}

/**
 * A changed field's value for display. A label captured at write time wins; then priorities
 * are translated, reference ids are resolved through workspace data, and any other id-looking
 * value is hidden. Empty values read as "—".
 */
export function formatChangeValue(
  field: string,
  value: unknown,
  label: unknown,
  names: ReferenceNames,
  t: Translate,
): string {
  if (isEmpty(value)) return "—";
  if (typeof label === "string" && label !== "") return label;
  if (typeof value === "boolean") return t(value ? "auditLog.value.yes" : "auditLog.value.no");
  if (field === "priority" && typeof value === "string") {
    const translated = t(`enum.priority.${value}`);
    return translated === `enum.priority.${value}` ? value : translated;
  }
  if (isReferenceField(field)) {
    const ids = Array.isArray(value) ? value : [value];
    return ids.map((id) => resolveReference(field, String(id), names, t)).join(", ");
  }
  if (isUlid(value)) return t("auditLog.value.unavailable");
  return formatInlineValue(value);
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && [...a].map(String).sort().join("\u0000") === [...b].map(String).sort().join("\u0000");
  }
  return formatInlineValue(a ?? null) === formatInlineValue(b ?? null);
}

export interface FieldChange {
  field: string;
  label: string;
  from: string;
  to: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return isStructuredValue(value) && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

/**
 * The fields a before/after pair changed, readable: translated field names and values from
 * the stored labels, the workspace data or a deleted/unavailable placeholder. A pair of plain
 * values (a single setting) yields one change with an empty field name.
 */
export function describeChanges(metadata: Record<string, unknown>, names: ReferenceNames, t: Translate): FieldChange[] {
  const { before, after } = metadata;
  if (before === undefined && after === undefined) return [];

  if (!isStructuredValue(before) && !isStructuredValue(after)) {
    if (sameValue(before, after)) return [];
    return [{ field: "", label: "", from: formatChangeValue("", before, undefined, names, t), to: formatChangeValue("", after, undefined, names, t) }];
  }

  const b = asRecord(before);
  const a = asRecord(after);
  const beforeLabels = asRecord(metadata.beforeLabels);
  const afterLabels = asRecord(metadata.afterLabels);
  return Object.keys(a)
    .filter((field) => !sameValue(b[field], a[field]))
    .map((field) => ({
      field,
      label: fieldLabel(field, t),
      from: formatChangeValue(field, b[field], beforeLabels[field], names, t),
      to: formatChangeValue(field, a[field], afterLabels[field], names, t),
    }));
}

/** A change on one line: "Department: — → Support", or "en → es" for a single setting. */
export function formatChange(change: FieldChange): string {
  const values = `${change.from} → ${change.to}`;
  return change.label ? `${change.label}: ${values}` : values;
}

/** Actions whose metadata `content` is a comment. */
export function isCommentAction(action: string): boolean {
  return action === "comment-created" || action === "comment-edited" || action === "portal-comment-created";
}

const EMAIL_ACTIONS = new Set(["email-sent", "email-send-failed"]);

/** Whether an entry records an email, sent or not */
export function isEmailAction(action: string): boolean {
  return EMAIL_ACTIONS.has(action);
}

function emailList(value: unknown, t: Translate, shown = 2): string {
  const emails = (Array.isArray(value) ? value : [value]).filter((e): e is string => typeof e === "string" && !!e);
  if (emails.length <= shown) return emails.join(", ");
  return `${emails.slice(0, shown).join(", ")} ${t("invitations.andMore").replace("{count}", String(emails.length - shown))}`;
}

/**
 * One line for an email entry: who it was for, what it was about and, when it did not leave, why.
 * "To: a@x.com · TK-000003 Printer broken · No mail server configured"
 */
export function emailSummary(metadata: Record<string, unknown>, failed: boolean, t: Translate): string {
  const parts: string[] = [];
  const to = emailList(metadata.to, t);
  if (to) parts.push(`${t("auditLog.summary.to")}: ${to}`);

  const ticket = [metadata.ticketReference, metadata.ticketName].filter((v) => typeof v === "string" && v).join(" ");
  if (ticket) parts.push(ticket);
  else if (typeof metadata.subject === "string" && metadata.subject) parts.push(metadata.subject);

  if (failed) {
    const reasonKey = `auditLog.reason.${String(metadata.reason ?? "")}`;
    const reason = metadata.reason && t(reasonKey) !== reasonKey ? t(reasonKey) : null;
    const error = typeof metadata.error === "string" ? metadata.error.slice(0, 80) : null;
    // The plain reason, then the server's words when there are any
    const why = [reason, error].filter(Boolean).join(": ");
    if (why) parts.push(why);
  }
  return parts.join(" · ");
}

/** A stored code (category, level, source, reason) in the reader's language, or as stored when untranslated */
export function codeLabel(prefix: string, code: string | null | undefined, t: (key: any) => string): string {
  if (!code) return "—";
  const key = `${prefix}.${code}`;
  const translated = t(key);
  return translated && translated !== key ? translated : code;
}

/** Fields only someone tracing a problem needs: ids and internal codes, shown folded */
export function isTechnicalField(key: string, value: unknown): boolean {
  return key === "errorCode" || key.endsWith("Id") || isUlid(value);
}

/** Stored codes shown in the reader's language: email kind and the server that sent it */
export function metadataValueLabel(key: string, value: unknown, t: (key: any) => string): unknown {
  if (typeof value !== "string") return value;
  if (key === "type") return codeLabel("auditLog.emailType", value, t);
  if (key === "via") return codeLabel("auditLog.emailVia", value, t);
  if (key === "priority" || key === "status" || key === "role") return codeLabel(`enum.${key}`, value, t);
  return value;
}
