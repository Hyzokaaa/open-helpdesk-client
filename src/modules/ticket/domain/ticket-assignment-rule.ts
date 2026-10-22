/** Somebody's work: these statuses always have an assignee. Mirrors the backend's rule. */
export const WORK_STATUSES = ["pending", "in-progress"];

/**
 * What changing only the status does to the assignee, to say it before it happens: the queue lets
 * go of whoever had it, and work with nobody assigned is taken by whoever moves it.
 */
export function assignmentAfterStatus(status: string, assigneeId: string | null): "lets-go" | "takes" | null {
  if (status === "open" && assigneeId) return "lets-go";
  if (WORK_STATUSES.includes(status) && !assigneeId) return "takes";
  return null;
}
