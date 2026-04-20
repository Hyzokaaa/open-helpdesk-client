export interface Notification {
  id: string;
  type: string;
  title: string;
  ticketId: string | null;
  workspaceSlug: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  emailTicketCreated: boolean;
  emailTicketAssigned: boolean;
  emailStatusChanged: boolean;
  emailCommentCreated: boolean;
  inAppTicketCreated: boolean;
  inAppTicketAssigned: boolean;
  inAppStatusChanged: boolean;
  inAppCommentCreated: boolean;
  bellUnreadOnly: boolean;
}
