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
  emailCsatSurvey: boolean;
  emailTransferRequest: boolean;
  inAppTicketCreated: boolean;
  inAppTicketAssigned: boolean;
  inAppStatusChanged: boolean;
  inAppTicketUnassigned: boolean;
  inAppCommentCreated: boolean;
  inAppTransferRequest: boolean;
  emailUpgradeAvailable: boolean;
  inAppUpgradeAvailable: boolean;
  inAppInvitationExpired: boolean;
  bellUnreadOnly: boolean;
}
