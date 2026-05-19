import { http } from "@modules/app/modules/http/domain/http";
import { PaginatedResult } from "@modules/shared/domain/pagination-result";

export interface TicketListItem {
  id: string;
  name: string;
  priority: string;
  status: string;
  category: string;
  creatorId: string;
  assigneeId: string | null;
  ticketNumber: number;
  createdAt: string | null;
  tagIds: string[];
  customFields: Record<string, unknown>;
}

export interface TicketDetail {
  id: string;
  name: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  workspaceId: string;
  creatorId: string;
  assigneeId: string | null;
  resolvedAt: string | null;
  tagIds: string[];
  customFields: Record<string, unknown>;
  discardReason: string | null;
}

export interface TicketFilters {
  status?: string;
  excludeStatus?: string;
  priority?: string;
  assigneeId?: string;
  creatorId?: string;
  tagIds?: string[];
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  page?: number;
  limit?: number;
}

export async function listTickets(
  workspaceId: string,
  filters: TicketFilters = {},
): Promise<PaginatedResult<TicketListItem>> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.excludeStatus) params.set("excludeStatus", filters.excludeStatus);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
  if (filters.creatorId) params.set("creatorId", filters.creatorId);
  if (filters.tagIds && filters.tagIds.length > 0)
    params.set("tagIds", filters.tagIds.join(","));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 20));

  const res = await http.get<PaginatedResult<TicketListItem>>(
    `/workspaces/${workspaceId}/tickets?${params}`,
  );
  return res.data;
}

export async function listAllTickets(
  workspaceId: string,
  filters: Omit<TicketFilters, "page" | "limit"> = {},
): Promise<TicketListItem[]> {
  const all: TicketListItem[] = [];
  let page = 1;
  while (true) {
    const result = await listTickets(workspaceId, { ...filters, page, limit: 100 });
    all.push(...result.items);
    if (all.length >= result.total) break;
    page++;
  }
  return all;
}

export async function getTicket(
  workspaceId: string,
  ticketId: string,
): Promise<TicketDetail> {
  const res = await http.get<TicketDetail>(
    `/workspaces/${workspaceId}/tickets/${ticketId}`,
  );
  return res.data;
}

export async function createTicket(
  workspaceId: string,
  data: {
    name: string;
    description: string;
    priority: string;
    category: string;
    tagIds: string[];
    customFields?: Record<string, unknown>;
  },
): Promise<{ id: string }> {
  const res = await http.post(`/workspaces/${workspaceId}/tickets`, data);
  return res.data;
}

export async function updateTicket(
  workspaceId: string,
  ticketId: string,
  data: Partial<{
    name: string;
    description: string;
    priority: string;
    category: string;
    tagIds: string[];
    customFields: Record<string, unknown>;
  }>,
): Promise<void> {
  await http.patch(`/workspaces/${workspaceId}/tickets/${ticketId}`, data);
}

export async function changeTicketStatus(
  workspaceId: string,
  ticketId: string,
  status: string,
  discardReason?: string,
): Promise<void> {
  await http.patch(`/workspaces/${workspaceId}/tickets/${ticketId}/status`, {
    status,
    ...(discardReason ? { discardReason } : {}),
  });
}

export async function assignTicket(
  workspaceId: string,
  ticketId: string,
  assigneeId: string | null,
): Promise<void> {
  await http.patch(`/workspaces/${workspaceId}/tickets/${ticketId}/assign`, {
    assigneeId,
  });
}

export async function deleteTicket(
  workspaceId: string,
  ticketId: string,
): Promise<void> {
  await http.delete(`/workspaces/${workspaceId}/tickets/${ticketId}`);
}

export interface BulkResult {
  ticketId: string;
  success: boolean;
  error?: string;
}

export async function bulkChangeStatus(
  workspaceId: string,
  ticketIds: string[],
  status: string,
  discardReason?: string,
): Promise<BulkResult[]> {
  const res = await http.patch<BulkResult[]>(`/workspaces/${workspaceId}/tickets/bulk/status`, {
    ticketIds,
    status,
    ...(discardReason ? { discardReason } : {}),
  });
  return res.data;
}

export async function bulkDeleteTickets(
  workspaceId: string,
  ticketIds: string[],
): Promise<BulkResult[]> {
  const res = await http.post<BulkResult[]>(`/workspaces/${workspaceId}/tickets/bulk/delete`, {
    ticketIds,
  });
  return res.data;
}
