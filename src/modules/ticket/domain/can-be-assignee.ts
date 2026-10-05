// Mirrors the backend EnsureTicketAssignee: only roles holding ticket.pickup
// (admin, supervisor, agent) may be assigned or receive a transfer.
const ASSIGNABLE_ROLES = new Set(["admin", "supervisor", "agent"]);

export function canBeAssignee(role: string): boolean {
  return ASSIGNABLE_ROLES.has(role);
}
