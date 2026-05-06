import type { HttpResponseError } from "@modules/app/modules/http/domain/http";
import { toast } from "react-toastify";
import { t } from "@modules/app/i18n/translations";

type PlanLimitKey =
  | "planLimit.workspaceReadOnly"
  | "planLimit.agentDeactivated"
  | "planLimit.cannedResponsesBlocked"
  | null;

const MESSAGE_MAP: Array<{ match: string; key: PlanLimitKey }> = [
  { match: "read-only", key: "planLimit.workspaceReadOnly" },
  { match: "agent seat", key: "planLimit.agentDeactivated" },
  { match: "Canned responses", key: "planLimit.cannedResponsesBlocked" },
];

export function getPlanLimitKey(err: unknown): PlanLimitKey {
  const error = err as HttpResponseError;
  if (error?.status !== 403 || !error?.message) return null;

  for (const { match, key } of MESSAGE_MAP) {
    if (error.message.includes(match)) return key;
  }

  if (error.message.includes("Upgrade")) return "planLimit.workspaceReadOnly";
  return null;
}

export function isPlanLimitError(err: unknown): boolean {
  return getPlanLimitKey(err) !== null;
}

export function handlePlanLimitError(err: unknown, fallbackMessage?: string): boolean {
  const key = getPlanLimitKey(err);
  if (key) {
    toast.warning(t(key), { toastId: "plan-limit" });
    return true;
  }
  if (fallbackMessage) {
    const error = err as HttpResponseError;
    if (!error?.handled) toast.error(fallbackMessage);
  }
  return false;
}
