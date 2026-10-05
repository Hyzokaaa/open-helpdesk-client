// Mirrors RemoveTicketParticipantCommand: anyone who can see the ticket may unfollow
// themselves; removing someone else needs ticket.participants.manage.
export function canRemoveFollower(
  followerUserId: string,
  currentUserId: string | undefined,
  canManageFollowers: boolean,
): boolean {
  if (currentUserId !== undefined && followerUserId === currentUserId) return true;
  return canManageFollowers;
}
