/** Who can be offered in the "@" popup: enough of a workspace member to rank them. */
export interface MentionCandidate {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
}

const MAX = 8;

/**
 * The people the "@" popup offers, the ticket's own first. With nothing typed yet, only the people of
 * the ticket (in the order given: assignee, requester, followers, those who wrote). While typing, the
 * ticket's matches come first and the rest of the team after. A customer is offered only when they
 * are on the ticket: mentioning one from elsewhere would bring them into a conversation not theirs.
 * A ticket with nobody else on it offers the team, so the popup is never empty for no reason.
 */
export function mentionCandidates<T extends MentionCandidate>(members: T[], ticketUserIds: string[], query: string): T[] {
  const onTicket = new Map(ticketUserIds.map((id, i) => [id, i]));
  const allowed = members.filter((m) => m.role !== "user" || onTicket.has(m.userId));
  const ticketPeople = allowed
    .filter((m) => onTicket.has(m.userId))
    .sort((a, b) => onTicket.get(a.userId)! - onTicket.get(b.userId)!);
  const rest = allowed.filter((m) => !onTicket.has(m.userId));

  const q = query.trim().toLowerCase();
  if (!q) return (ticketPeople.length > 0 ? ticketPeople : rest).slice(0, MAX);
  const matches = (m: T) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q);
  return [...ticketPeople.filter(matches), ...rest.filter(matches)].slice(0, MAX);
}

/** The ticket's people for the popup, most involved first, each once and without the one writing. */
export function ticketMentionIds(props: {
  assigneeId: string | null | undefined;
  reporterId: string | null | undefined;
  followerIds: string[];
  /** Comment authors, oldest first: the latest ones rank higher. */
  commentAuthorIds: string[];
  selfId: string | undefined;
}): string[] {
  const ordered = [props.assigneeId, props.reporterId, ...props.followerIds, ...[...props.commentAuthorIds].reverse()];
  const ids: string[] = [];
  for (const id of ordered) if (id && id !== props.selfId && !ids.includes(id)) ids.push(id);
  return ids;
}
