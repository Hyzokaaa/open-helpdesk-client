/**
 * Why the ticket list is empty, which decides what it says:
 * - "no-results": a filter or the search hides tickets; offer to clear it.
 * - "empty": nothing narrows the list (the default statuses, every project); offer to create one.
 * - "view": a project simply has none.
 */
export type TicketListEmpty = "no-results" | "empty" | "view";

export function ticketListEmpty(state: {
  /** The filters that narrow the list; the default statuses do not count. */
  activeFilterCount: number;
  search?: string;
  projectId?: string;
}): TicketListEmpty {
  if (state.activeFilterCount > 0 || state.search) return "no-results";
  if (!state.projectId) return "empty";
  return "view";
}
