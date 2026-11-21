export interface Notification {
  id: string;
  type: string;
  title: string;
  ticketId: string | null;
  workspaceSlug: string;
  /** Where it takes you, for a notice that is not about a ticket */
  link?: string | null;
  /** A notice kind's name in each language, as the server declares it (an extension's too) */
  label?: Record<string, string> | null;
  isRead: boolean;
  createdAt: string;
}

export type NoticeChannel = "inApp" | "email" | "matrix";

/** A kind of notice that is not about a ticket, with what the person chose on each channel */
export interface NoticeSetting {
  key: string;
  label: Record<string, string>;
  description: Record<string, string>;
  /** A mandatory channel is always on and cannot be changed */
  channels: Record<NoticeChannel, { enabled: boolean; mandatory: boolean }>;
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
  inAppUnattendedReply: boolean;
  emailUnattendedReply: boolean;
  inAppMentioned: boolean;
  emailMentioned: boolean;
  matrixEnabled: boolean;
  matrixTicketCreated: boolean;
  matrixTicketAssigned: boolean;
  matrixStatusChanged: boolean;
  matrixTicketUnassigned: boolean;
  matrixCommentCreated: boolean;
  matrixTransferRequest: boolean;
  matrixUnattendedReply: boolean;
  matrixMentioned: boolean;
  bellUnreadOnly: boolean;
}
