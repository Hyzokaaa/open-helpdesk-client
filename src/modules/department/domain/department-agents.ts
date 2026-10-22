/** Who can be in a department: the team, not the requesters (the User role). Matches the backend. */
export const DEPARTMENT_ROLES = ["admin", "supervisor", "agent"];

export function canBeDepartmentAgent(role: string): boolean {
  return DEPARTMENT_ROLES.includes(role);
}

/** Whether a search finds a person by name or email, ignoring case and accents. */
export function matchesPerson(person: { firstName: string; lastName: string; email: string }, query: string): boolean {
  const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const q = fold(query.trim());
  if (!q) return true;
  return fold(`${person.firstName} ${person.lastName} ${person.email}`).includes(q);
}

/** Whether two lists of agents hold different people, whatever the order. */
export function agentsChanged(before: string[], after: string[]): boolean {
  return before.length !== after.length || after.some((id) => !before.includes(id));
}

/** Up to two initials of a name, for the small avatars of the list. */
export function initialsOf(firstName: string, lastName: string): string {
  return `${firstName.trim()[0] ?? ""}${lastName.trim()[0] ?? ""}`.toUpperCase() || "?";
}
