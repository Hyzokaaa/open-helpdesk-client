/** What each notification type is called in the bell, as a translation key */
const LABEL_KEYS: Record<string, string> = {
  "ticket-created": "notifications.ticketCreated",
  "ticket-assigned": "notifications.ticketAssigned",
  "status-changed": "notifications.statusChanged",
  "ticket-unassigned": "notifications.ticketUnassigned",
  "comment-created": "notifications.commentCreated",
  "transfer-request": "notifications.transferRequest",
  "upgrade-available": "notifications.upgradeAvailable",
  "invitation-expired": "notifications.invitationExpired",
};

export function notificationLabelKey(type: string): string {
  return LABEL_KEYS[type] ?? "notifications.ticketCreated";
}

/** Where opening a notification takes you: its ticket, or the page that deals with it */
export function notificationTarget(n: { type: string; ticketId: string | null; workspaceSlug: string | null }): string | null {
  if (n.ticketId) return `/dashboard/workspaces/${n.workspaceSlug}/tickets?open=${n.ticketId}`;
  if (n.type === "invitation-expired" && n.workspaceSlug) return `/dashboard/workspaces/${n.workspaceSlug}/invitations`;
  if (n.type === "upgrade-available") return "/dashboard/admin/updates";
  return null;
}
