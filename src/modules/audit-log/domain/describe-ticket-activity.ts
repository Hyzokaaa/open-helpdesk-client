import { commentPreview, describeChanges, formatChange } from "./audit-summary";

/** The fields of an activity entry this module reads. */
export interface TicketActivityEntry {
  action: string;
  source?: string | null;
  metadata?: Record<string, unknown> | null;
}

type Translate = (key: string) => string;
type TranslateEnum = (prefix: string, value: string) => string;

/**
 * What a person did to a ticket, as the rest of a sentence that starts with their name:
 * "changed status Pending → In Progress", "assigned to Ana", "removed the file x.pdf".
 */
export function describeTicketActivity(item: TicketActivityEntry, t: Translate, tEnum?: TranslateEnum): string {
  const meta = item.metadata ?? {};
  const before = meta.before as Record<string, unknown> | undefined;
  const after = meta.after as Record<string, unknown> | undefined;
  const status = (value: unknown) => (tEnum && typeof value === "string" ? tEnum("status", value) : String(value));

  switch (item.action) {
    case "ticket-created":
      return item.source === "email" ? `${t("auditLog.feed.created")} ${t("auditLog.feed.viaEmail")}` : t("auditLog.feed.created");

    case "portal-ticket-created":
      return `${t("auditLog.feed.created")} ${t("auditLog.feed.viaPortal")}`;

    case "portal-comment-created": {
      const preview = commentPreview(meta.content, 60);
      const label = `${t("auditLog.feed.commented")} ${t("auditLog.feed.viaPortal")}`;
      return preview ? `${label}: "${preview}"` : label;
    }

    case "attachment-uploaded":
      return meta.originalName ? `${t("auditLog.feed.attached")} ${meta.originalName}` : t("auditLog.feed.attached");

    case "attachment-deleted":
      return meta.originalName ? `${t("auditLog.feed.attachmentRemoved")} ${meta.originalName}` : t("auditLog.feed.attachmentRemoved");

    case "ticket-updated": {
      if (!before || !after) return t("auditLog.feed.updated");
      const changes = describeChanges(meta, {}, t).map(formatChange);
      if (changes.length === 0) return t("auditLog.feed.updated");
      return `${t("auditLog.feed.updated")} (${changes.join(", ")})`;
    }

    case "ticket-status-changed":
      if (before && after) {
        return `${t("auditLog.feed.statusChanged")} ${status(before.status)} → ${status(after.status)}`;
      }
      return t("auditLog.feed.statusChanged");

    case "ticket-assigned": {
      const newAssignee = after?.assignee;
      if (newAssignee) {
        // Stored as "Name (email)"; the name reads enough here, the audit log keeps both
        return `${t("auditLog.feed.assigned")} ${String(newAssignee).replace(/\s*\([^()]*@[^()]*\)\s*$/, "")}`;
      }
      return t("auditLog.feed.unassigned");
    }

    case "participant-added":
    case "participant-removed": {
      // Stored as "Name (email)"; the name reads enough here
      const who = typeof meta.target === "string" ? meta.target.replace(/\s*\([^()]*@[^()]*\)\s*$/, "").trim() : "";
      const role = meta.role === "collaborator" ? t("auditLog.feed.asCollaborator") : t("auditLog.feed.asFollower");
      // Followers added as a side effect say why: commenting, a mention or a transfer offer
      if (item.action === "participant-added" && meta.reason === "comment") return t("auditLog.feed.startedFollowing");
      const why = meta.reason === "mention" ? t("auditLog.feed.byMention") : meta.reason === "transfer-request" ? t("auditLog.feed.byTransferRequest") : "";
      return item.action === "participant-added"
        ? `${t("auditLog.feed.addedParticipant")} ${who} ${role} ${why}`.replace(/\s+/g, " ").trim()
        : `${t("auditLog.feed.removedParticipant")} ${who} ${t("auditLog.feed.fromParticipants")}`.replace(/\s+/g, " ").trim();
    }

    case "ticket-deleted":
      return t("auditLog.feed.deleted");

    case "comment-created": {
      if (item.source === "email") return `${t("auditLog.feed.commented")} ${t("auditLog.feed.viaEmail")}`;
      const preview = commentPreview(meta.content, 60);
      if (preview) return `${t("auditLog.feed.commented")}: "${preview}"`;
      return t("auditLog.feed.commented");
    }

    default: {
      const key = `auditLog.action.${item.action}`;
      const label = t(key);
      return label && label !== key ? label : item.action;
    }
  }
}
