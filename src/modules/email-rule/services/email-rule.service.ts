import { http } from "@modules/app/modules/http/domain/http";

export interface RuleCondition {
  field: "from" | "subject" | "to";
  operator: "contains" | "equals" | "starts-with" | "ends-with";
  value: string;
}

export interface RuleAction {
  type: "reject" | "set-department" | "set-priority" | "set-category" | "add-tags" | "assign-to";
  value?: string;
}

export interface EmailRule {
  id: string;
  name: string;
  position: number;
  isActive: boolean;
  mailboxIds: string[];
  conditions: RuleCondition[];
  actions: RuleAction[];
}

export async function listEmailRules(workspaceSlug: string): Promise<EmailRule[]> {
  const res = await http.get<EmailRule[]>(`/workspaces/${workspaceSlug}/email-rules`);
  return res.data;
}

export async function createEmailRule(
  workspaceSlug: string,
  data: { name: string; mailboxIds?: string[]; conditions: RuleCondition[]; actions: RuleAction[] },
): Promise<{ id: string }> {
  const res = await http.post(`/workspaces/${workspaceSlug}/email-rules`, data);
  return res.data;
}

export async function updateEmailRule(
  workspaceSlug: string,
  id: string,
  data: Partial<Pick<EmailRule, "name" | "isActive" | "mailboxIds" | "conditions" | "actions">>,
): Promise<void> {
  await http.patch(`/workspaces/${workspaceSlug}/email-rules/${id}`, data);
}

export async function deleteEmailRule(workspaceSlug: string, id: string): Promise<void> {
  await http.delete(`/workspaces/${workspaceSlug}/email-rules/${id}`);
}

export async function reorderEmailRules(workspaceSlug: string, orderedIds: string[]): Promise<void> {
  await http.put(`/workspaces/${workspaceSlug}/email-rules/reorder`, { orderedIds });
}
