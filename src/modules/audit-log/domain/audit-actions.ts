import translations from "@modules/app/i18n/translations";

/**
 * The audit actions the filters offer, derived from the translated action names so a new action
 * appears in the filters as soon as it has a name, instead of being added to hand-kept lists.
 */
const ACTION_PREFIX = "auditLog.action.";

export const ALL_AUDIT_ACTIONS: string[] = Object.keys(translations)
  .filter((key) => key.startsWith(ACTION_PREFIX))
  .map((key) => key.slice(ACTION_PREFIX.length));

const SECURITY_ACTIONS = new Set([
  "user-login-failed",
  "user-oauth-login-failed",
  "user-password-change-failed",
  "user-password-reset-failed",
  "permission-denied",
  "api-session-exchanged",
  "workspace-custom-domain-verification-failed",
  "payment-webhook-rejected",
]);

/** The group an action is listed under in the filters. */
export function actionGroup(action: string): string {
  if (SECURITY_ACTIONS.has(action)) return "Security";
  if (/^(ticket|comment|transfer-request|attachment|participant|portal|csat)-/.test(action)) return "Ticket";
  if (/^(member|invitation|organization-member)-/.test(action) || action === "workspace-members-imported") return "Members";
  if (/^user-/.test(action)) return "User";
  if (/^(mailbox|imap|email)-/.test(action)) return "Email";
  if (/^(subscription|payment|discount)-/.test(action)) return "Billing";
  if (/^(system|workspace-creation-policy)-/.test(action)) return "System";
  if (/^kb-/.test(action)) return "Knowledge base";
  if (/^workspace-/.test(action)) return "Workspace";
  return "Config";
}

const WORKSPACE_ACTIONS_OF_SYSTEM_GROUPS = new Set([
  "user-created",
  "permission-denied",
  "api-session-exchanged",
  "workspace-custom-domain-verification-failed",
]);

/**
 * Actions that are only ever recorded installation-wide (sign-ins, account settings, billing,
 * system settings), so the workspace log does not offer them as filters.
 */
export function isSystemOnlyAction(action: string): boolean {
  // Accounts created through a workspace, and refusals or API sessions in it, are in its log
  if (WORKSPACE_ACTIONS_OF_SYSTEM_GROUPS.has(action)) return false;
  return SECURITY_ACTIONS.has(action) || /^(user|system|subscription|payment|discount|workspace-creation-policy)-/.test(action);
}

export interface ActionOption {
  value: string;
  label: string;
  group: string;
}

/** The filter options for the workspace log or the system log, translated and grouped. */
export function actionOptions(scope: "workspace" | "system", t: (key: string) => string): ActionOption[] {
  return ALL_AUDIT_ACTIONS
    .filter((action) => scope === "system" || !isSystemOnlyAction(action))
    .map((action) => ({ value: action, label: t(`${ACTION_PREFIX}${action}`) || action, group: actionGroup(action) }))
    .sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label));
}

/** The translated name of an entity type, or the type itself when it has none. */
export function entityTypeLabel(entityType: string, t: (key: string) => string): string {
  const key = `auditLog.entity.${entityType}`;
  const label = t(key);
  return label && label !== key ? label : entityType;
}
