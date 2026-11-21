/** The query a "new team member" notice opens the members page with: who just joined */
export const JOINED_PARAM = "joined";

/** The ids the notice names, so the page can mark those rows */
export function joinedMemberIds(params: URLSearchParams): Set<string> {
  return new Set((params.get(JOINED_PARAM) ?? "").split(",").map((id) => id.trim()).filter(Boolean));
}
