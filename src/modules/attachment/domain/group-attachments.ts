import type { TicketAttachment } from "../services/attachment.service";

export interface GroupedAttachments<T> {
  /** Files of the ticket itself: those it was created with and those added to it later. */
  ticket: T[];
  /** Files of each comment, keyed by comment id. */
  byComment: Map<string, T[]>;
}

/**
 * Places each file with the message it came with. A file whose comment is not among
 * `commentIds` (deleted, or not loaded) falls back to the ticket so it never disappears.
 */
export function groupAttachments<T extends { commentId: string | null }>(attachments: T[], commentIds: string[]): GroupedAttachments<T> {
  const known = new Set(commentIds);
  const ticket: T[] = [];
  const byComment = new Map<string, T[]>();

  for (const attachment of attachments) {
    const commentId = attachment.commentId;
    if (commentId && known.has(commentId)) {
      byComment.set(commentId, [...(byComment.get(commentId) ?? []), attachment]);
    } else {
      ticket.push(attachment);
    }
  }
  return { ticket, byComment };
}

/** Files uploaded with the form are saved a moment after the ticket itself. */
const CREATION_GRACE_MS = 5 * 60 * 1000;

/**
 * Whether a file of the ticket was added after the ticket was created, so it is shown with who
 * added it and when instead of passing for part of the original request.
 */
export function isAddedLater(attachment: TicketAttachment, ticketCreatedAt: string | null | undefined): boolean {
  if (!attachment.createdAt || !ticketCreatedAt) return false;
  return new Date(attachment.createdAt).getTime() - new Date(ticketCreatedAt).getTime() > CREATION_GRACE_MS;
}
