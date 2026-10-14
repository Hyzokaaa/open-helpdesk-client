export type SlaTargetStatus =
  | { kind: "met" }
  | { kind: "missed" }
  /** Still on time; low when under a quarter of the target is left */
  | { kind: "remaining"; ms: number; low: boolean }
  | { kind: "overdue"; ms: number };

interface Input {
  /** Hours the policy gives for this priority; null when it sets none */
  targetHours: number | null;
  createdAt: string | null;
  /** When the first response or the resolution happened */
  completedAt: string | null;
  /** Set by the backend once it saw the deadline pass */
  breached: boolean;
  now?: Date;
}

/**
 * Where a ticket stands against one SLA target. Null when there is no target to measure against.
 * A ticket closed without reaching the milestone (discarded, or resolved without a reply) is the
 * caller's to leave out, as the target no longer applies.
 */
export function slaTargetStatus({ targetHours, createdAt, completedAt, breached, now = new Date() }: Input): SlaTargetStatus | null {
  if (targetHours === null || !createdAt) return null;
  const target = targetHours * 3600000;
  const deadline = new Date(createdAt).getTime() + target;

  if (completedAt) {
    return breached || new Date(completedAt).getTime() > deadline ? { kind: "missed" } : { kind: "met" };
  }
  const left = deadline - now.getTime();
  if (left > 0) return { kind: "remaining", ms: left, low: left < target * 0.25 };
  return { kind: "overdue", ms: -left };
}
