const ALL_INVITE_ROLES = ["admin", "supervisor", "agent"] as const;
export type InviteRole = (typeof ALL_INVITE_ROLES)[number];

// Mirrors the backend invitation rule: only workspace admins (or system admins) may
// invite another admin; a supervisor can invite up to supervisor.
export function invitableRoles(requesterRole: string | undefined, isSystemAdmin: boolean): InviteRole[] {
  if (isSystemAdmin || requesterRole === "admin") return [...ALL_INVITE_ROLES];
  return ALL_INVITE_ROLES.filter((r) => r !== "admin");
}
