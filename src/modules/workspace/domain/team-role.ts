/** The workspace role of customers; every other role (admin, supervisor, agent) is the team. */
const CUSTOMER_ROLE = "user";

/** Whether a membership role belongs to the team. Unknown (no role) is not the team. */
export function isTeamRole(role: string | null | undefined): boolean {
  return !!role && role !== CUSTOMER_ROLE;
}
