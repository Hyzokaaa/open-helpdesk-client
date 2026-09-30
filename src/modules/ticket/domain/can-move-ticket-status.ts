import { P } from "@modules/workspace/domain/permissions";

/**
 * Whether the user may change a ticket's status directly. Roles that see every ticket (admin,
 * supervisor, system admin) always may; everyone else only on tickets assigned to them. An open
 * ticket nobody has taken must be picked up instead, which assigns it on the way.
 *
 * Mirrors the rule enforced by the backend's ChangeTicketStatusCommand.
 */
export function canMoveTicketStatus(
  ticket: { assigneeId: string | null },
  userId: string | undefined,
  can: (permission: string) => boolean,
): boolean {
  return can(P.TICKET_VIEW) || (!!userId && ticket.assigneeId === userId);
}

/**
 * Whether the user may discard an open ticket nobody has taken without picking it up first
 * (spam, duplicates). Only relevant to those who cannot move the ticket freely already; the
 * backend allows it and audits who did it.
 */
export function canDiscardFromQueue(
  ticket: { status: string; assigneeId: string | null },
  userId: string | undefined,
  can: (permission: string) => boolean,
): boolean {
  return can(P.TICKET_CHANGE_STATUS)
    && !canMoveTicketStatus(ticket, userId, can)
    && ticket.status === "open"
    && !ticket.assigneeId;
}
