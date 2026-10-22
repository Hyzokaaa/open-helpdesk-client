import { P } from "@modules/workspace/domain/permissions";
import { STATUSES } from "./ticket-enums";

export const CLOSED_STATUSES = ["resolved", "discarded"];

export function isClosedStatus(status: string): boolean {
  return CLOSED_STATUSES.includes(status);
}

/**
 * The statuses a ticket can be moved to by "Change status": a closed one only between closed
 * statuses, since taking it back to work is reopening, with a reason. Mirrors the backend.
 */
export function statusesFrom(status: string): readonly string[] {
  return isClosedStatus(status) ? CLOSED_STATUSES : STATUSES;
}

/** Whether the viewer may reopen this ticket: closed, and the reopen permission. */
export function canReopenTicket(ticket: { status: string }, can: (permission: string) => boolean): boolean {
  return isClosedStatus(ticket.status) && can(P.TICKET_REOPEN);
}

/** Where a reopened ticket can go: the queue, or back to somebody's work. Mirrors the backend. */
export const REOPEN_TARGETS = ["open", "pending", "in-progress"] as const;
export type ReopenTarget = (typeof REOPEN_TARGETS)[number];

/**
 * The targets this viewer can choose: the queue is choosing nobody, so it needs the assign
 * permission, as on the backend.
 */
export function reopenTargetsFor(canChooseAssignee: boolean): readonly ReopenTarget[] {
  return canChooseAssignee ? REOPEN_TARGETS : REOPEN_TARGETS.filter((s) => s !== "open");
}

/** Where the modal starts: the board column the card was dropped on, if allowed; else In progress. */
export function initialReopenTarget(droppedOn: string | undefined, canChooseAssignee: boolean): ReopenTarget {
  const allowed = reopenTargetsFor(canChooseAssignee);
  return allowed.find((s) => s === droppedOn) ?? "in-progress";
}

/** The note counts once trimmed, so blank space does not pass for a reason. */
export function reopenNoteLength(note: string): number {
  return note.trim().length;
}

/**
 * Whether the requester replied after the ticket was resolved: the team is told on the ticket,
 * since the reply alone does not reopen it.
 */
export function repliedAfterResolving(
  ticket: { status: string; resolvedAt: string | null; reporterId: string },
  comments: { authorId: string; createdAt: string | null }[],
): boolean {
  if (ticket.status !== "resolved" || !ticket.resolvedAt) return false;
  const resolved = new Date(ticket.resolvedAt).getTime();
  return comments.some((c) => c.authorId === ticket.reporterId && !!c.createdAt && new Date(c.createdAt).getTime() > resolved);
}
