/** What each notification type is called in the bell, as a translation key */
const LABEL_KEYS: Record<string, string> = {
  "ticket-created": "notifications.ticketCreated",
  "ticket-assigned": "notifications.ticketAssigned",
  "status-changed": "notifications.statusChanged",
  "ticket-unassigned": "notifications.ticketUnassigned",
  "comment-created": "notifications.commentCreated",
  mentioned: "notifications.mentioned",
  "transfer-request": "notifications.transferRequest",
  "upgrade-available": "notifications.upgradeAvailable",
  "invitation-expired": "notifications.invitationExpired",
  "unattended-reply": "notifications.unattendedReply",
};

/** A kind of its own (a notice, or one this client does not know yet) is named by the server, never guessed */
export function notificationLabel(
  n: { type: string; label?: Record<string, string> | null },
  lang: string,
  t: (key: string) => string,
): string {
  if (n.label) return noticeLabel(n.label, lang);
  const key = LABEL_KEYS[n.type];
  return key ? t(key) : "";
}

/** Where opening a notification takes you: its ticket, or the page that deals with it */
export function notificationTarget(n: { type: string; ticketId: string | null; workspaceSlug: string | null; link?: string | null }): string | null {
  if (n.ticketId) return `/dashboard/workspaces/${n.workspaceSlug}/tickets?open=${n.ticketId}`;
  // A notice that is not about a ticket says where it goes
  if (n.link) return n.link;
  if (n.type === "invitation-expired" && n.workspaceSlug) return `/dashboard/workspaces/${n.workspaceSlug}/invitations`;
  if (n.type === "upgrade-available") return "/dashboard/admin/updates";
  return null;
}

/** Past this the bell stops counting: two digits are as much as its badge has room for */
const BADGE_MAX = 99;

/** What the bell's badge says: nothing when all is read, the count up to 99, then "99+" */
export function unreadBadge(count: number): string | null {
  if (count <= 0) return null;
  return count > BADGE_MAX ? `${BADGE_MAX}+` : String(count);
}

/** A notice kind's name, as the server sent it, in the reader's language */
export function noticeLabel(label: Record<string, string>, lang: string): string {
  return label[lang] ?? label.en ?? "";
}
