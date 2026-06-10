import { http } from "@modules/app/modules/http/domain/http";

export interface WebhookDto {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  createdAt: string;
}

export const WEBHOOK_EVENTS = [
  "ticket.created",
  "ticket.statusChanged",
  "ticket.assigned",
  "ticket.deleted",
  "comment.created",
] as const;

export async function listWebhooks(slug: string): Promise<WebhookDto[]> {
  const res = await http.get<WebhookDto[]>(`/workspaces/${slug}/webhooks`);
  return res.data;
}

export async function createWebhook(
  slug: string,
  data: { url: string; events: string[]; secret?: string },
): Promise<WebhookDto> {
  const res = await http.post<WebhookDto>(`/workspaces/${slug}/webhooks`, data);
  return res.data;
}

export async function updateWebhook(
  slug: string,
  id: string,
  data: { url?: string; events?: string[]; isActive?: boolean },
): Promise<WebhookDto> {
  const res = await http.patch<WebhookDto>(`/workspaces/${slug}/webhooks/${id}`, data);
  return res.data;
}

export async function deleteWebhook(slug: string, id: string): Promise<void> {
  await http.delete(`/workspaces/${slug}/webhooks/${id}`);
}
