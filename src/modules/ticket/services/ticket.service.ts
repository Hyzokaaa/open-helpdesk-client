import { http } from "@modules/app/modules/http/domain/http";
import { PaginatedResult } from "@modules/shared/domain/pagination-result";
import type { PersonSummary } from "@modules/shared/domain/person-summary";
import { trackEvent } from "@modules/analytics/domain/analytics";

export interface TicketListItem {
  id: string;
  name: string;
  priority: string;
  status: string;
  categoryId: string | null;
  projectId: string | null;
  reporterId: string;
  assigneeId: string | null;
  ticketNumber: string;
  createdAt: string | null;
  tagIds: string[];
  departmentId: string | null;
  organizationId: string | null;
  customFields: Record<string, unknown>;
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
  /** How many times it was reopened. */
  reopenCount?: number;
}

/** Why a closed ticket was reopened; "requester" comes from the portal. */
export type TicketReopenReason = "issue-persists" | "closed-without-confirmation" | "work-missing" | "other" | "requester";
export const TEAM_REOPEN_REASONS: TicketReopenReason[] = ["issue-persists", "closed-without-confirmation", "work-missing", "other"];
/** The team explains a reopen in at least this many characters; the backend says the same. */
export const REOPEN_NOTE_MIN_LENGTH = 20;

/** The last time a ticket was reopened: who, when, why, and who had resolved it. */
export interface TicketReopen {
  byId: string;
  at: string;
  reason: TicketReopenReason;
  /** Seen by the team only; empty for the requester. */
  note: string;
  fromStatus: "resolved" | "discarded";
  previousResolvedById: string | null;
  previousResolvedAt: string | null;
  by?: PersonSummary | null;
  previousResolvedBy?: PersonSummary | null;
}

export interface TicketDetail {
  id: string;
  name: string;
  description: string;
  priority: string;
  status: string;
  categoryId: string | null;
  projectId: string | null;
  workspaceId: string;
  reporterId: string;
  source: string;
  registeredById: string | null;
  assigneeId: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  resolvedById: string | null;
  ticketNumber: string;
  createdAt: string | null;
  originDate: string | null;
  tagIds: string[];
  departmentId: string | null;
  organizationId: string | null;
  customFields: Record<string, unknown>;
  discardReason: string | null;
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
  descriptionEditedAt: string | null;
  /** When a person last did anything to the ticket */
  lastActivityAt?: string | null;
  /** Lines folded under the description: the signature of the email that opened the ticket. */
  descriptionQuotedLines?: number;
  accessLevel?: 'full' | 'readonly';
  aiCache?: Record<string, { source: string; result: string }>;
  reporter?: PersonSummary | null;
  assignee?: PersonSummary | null;
  registeredBy?: PersonSummary | null;
  resolvedBy?: PersonSummary | null;
  /** The first resolution, kept through reopens; resolvedAt empties while reopened. */
  firstResolvedAt?: string | null;
  reopenCount?: number;
  lastReopen?: TicketReopen | null;
  /** While resolved: whether whoever resolved it left a comment then. */
  resolvedWithComment?: boolean;
}

export interface DescriptionEditItem {
  id: string;
  content: string;
  editedById: string;
  createdAt: string;
}

/** Each list matches any of its values; "none" in the department, organization and category lists matches the tickets without one. */
export interface TicketFilters {
  search?: string;
  statuses?: string[];
  excludeStatus?: string;
  priorities?: string[];
  assigneeId?: string;
  reporterId?: string;
  tagIds?: string[];
  departmentIds?: string[];
  organizationIds?: string[];
  projectId?: string;
  categoryIds?: string[];
  /** Only the tickets reopened at least once. */
  reopened?: boolean;
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
  const list = (name: string, values?: string[]) => { if (values?.length) params.set(name, values.join(",")); };
  if (filters.search) params.set("search", filters.search);
  list("status", filters.statuses);
  if (filters.excludeStatus) params.set("excludeStatus", filters.excludeStatus);
  list("priority", filters.priorities);
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
  if (filters.reporterId) params.set("reporterId", filters.reporterId);
  list("tagIds", filters.tagIds);
  list("departmentId", filters.departmentIds);
  list("organizationId", filters.organizationIds);
  if (filters.projectId) params.set("projectId", filters.projectId);
  list("categoryId", filters.categoryIds);
  if (filters.reopened) params.set("reopened", "true");
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 20));

  const res = await http.get<PaginatedResult<TicketListItem>>(
    `/workspaces/${workspaceId}/tickets?${params}`,
  );
  return res.data;
}

export const MAX_BOARD_TICKETS = 500;

export interface ListAllTicketsResult {
  items: TicketListItem[];
  total: number;
  truncated: boolean;
}

export async function listAllTickets(
  workspaceId: string,
  filters: Omit<TicketFilters, "page" | "limit"> = {},
): Promise<ListAllTicketsResult> {
  const all: TicketListItem[] = [];
  let total = 0;
  let page = 1;
  while (true) {
    const result = await listTickets(workspaceId, { ...filters, page, limit: 100 });
    all.push(...result.items);
    total = result.total;
    if (all.length >= result.total || all.length >= MAX_BOARD_TICKETS) break;
    page++;
  }
  const items = all.slice(0, MAX_BOARD_TICKETS);
  return { items, total, truncated: total > MAX_BOARD_TICKETS };
}

/** What the email that opened the ticket carried besides its text (its signature). */
export async function getDescriptionQuotedText(workspaceId: string, ticketId: string): Promise<string> {
  const res = await http.get<{ content: string }>(`/workspaces/${workspaceId}/tickets/${ticketId}/quoted-text`);
  return res.data.content;
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
    categoryId: string;
    tagIds: string[];
    departmentId?: string;
    projectId?: string;
    customFields?: Record<string, unknown>;
    uploadTokens?: string[];
    onBehalfOf?: string;
  },
): Promise<{ id: string }> {
  const res = await http.post(`/workspaces/${workspaceId}/tickets`, data);
  trackEvent("ticket-created", { channel: "dashboard" });
  return res.data;
}

export async function updateTicket(
  workspaceId: string,
  ticketId: string,
  data: Partial<{
    name: string;
    description: string;
    priority: string;
    categoryId: string | null;
    tagIds: string[];
    departmentId: string | null;
    organizationId: string | null;
    projectId: string | null;
    customFields: Record<string, unknown>;
  }>,
): Promise<void> {
  await http.patch(`/workspaces/${workspaceId}/tickets/${ticketId}`, data);
}

/** Reopens a resolved or discarded ticket with a reason; `assigneeId` chooses who takes it (null: the queue). */
export async function reopenTicket(
  workspaceId: string,
  ticketId: string,
  data: { reason: TicketReopenReason; note: string; assigneeId?: string | null; status?: "open" | "pending" | "in-progress" },
): Promise<{ id: string; status: string; assigneeId: string | null; reopenCount: number }> {
  const res = await http.post(`/workspaces/${workspaceId}/tickets/${ticketId}/reopen`, data);
  return res.data;
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
  trackEvent("ticket-status-changed", { status });
}

export async function assignTicket(
  workspaceId: string,
  ticketId: string,
  assigneeId: string | null,
): Promise<void> {
  await http.patch(`/workspaces/${workspaceId}/tickets/${ticketId}/assign`, {
    assigneeId,
  });
  if (assigneeId) trackEvent("ticket-assigned", { via: "assign" });
}

export async function pickupTicket(
  workspaceSlug: string,
  ticketId: string,
  status?: string,
): Promise<{ id: string; status: string; assigneeId: string }> {
  const res = await http.post<{ id: string; status: string; assigneeId: string }>(
    `/workspaces/${workspaceSlug}/tickets/${ticketId}/pickup`,
    status ? { status } : {},
  );
  trackEvent("ticket-assigned", { via: "pickup" });
  return res.data;
}

export interface TransferRequestResult {
  id: string;
  transferRequestId: string;
  status: string;
  expiresAt: string;
}

export interface PendingTransfer {
  id: string;
  requesterId: string;
  requesterName: string;
  targetUserId: string;
  targetName: string;
  expiresAt: string;
}

export async function transferTicket(
  workspaceSlug: string,
  ticketId: string,
  assigneeId: string,
): Promise<TransferRequestResult> {
  const res = await http.patch<TransferRequestResult>(`/workspaces/${workspaceSlug}/tickets/${ticketId}/transfer`, { assigneeId });
  return res.data;
}

export async function getPendingTransfer(
  workspaceSlug: string,
  ticketId: string,
): Promise<PendingTransfer | null> {
  const res = await http.get<PendingTransfer | null>(`/workspaces/${workspaceSlug}/tickets/${ticketId}/transfer-requests/pending`);
  // A null from the backend arrives as an empty body, i.e. ""
  return res.data || null;
}

export async function acceptTransfer(
  workspaceSlug: string,
  ticketId: string,
  requestId: string,
): Promise<void> {
  await http.post(`/workspaces/${workspaceSlug}/tickets/${ticketId}/transfer-requests/${requestId}/accept`);
}

export async function rejectTransfer(
  workspaceSlug: string,
  ticketId: string,
  requestId: string,
): Promise<void> {
  await http.post(`/workspaces/${workspaceSlug}/tickets/${ticketId}/transfer-requests/${requestId}/reject`);
}

export async function cancelTransfer(
  workspaceSlug: string,
  ticketId: string,
  requestId: string,
): Promise<void> {
  await http.post(`/workspaces/${workspaceSlug}/tickets/${ticketId}/transfer-requests/${requestId}/cancel`);
}

export async function deleteTicket(
  workspaceId: string,
  ticketId: string,
): Promise<void> {
  await http.delete(`/workspaces/${workspaceId}/tickets/${ticketId}`);
}

export async function getDescriptionHistory(
  workspaceId: string,
  ticketId: string,
): Promise<DescriptionEditItem[]> {
  const res = await http.get<DescriptionEditItem[]>(
    `/workspaces/${workspaceId}/tickets/${ticketId}/description/history`,
  );
  return res.data;
}

export interface BulkResult {
  ticketId: string;
  success: boolean;
  error?: string;
  /** A closed ticket asked to go back to work: reopened one by one, with a reason. */
  needsReopen?: boolean;
  /** Asked to go to work with nobody assigned: bulk does not take tickets for whoever moves them. */
  needsAssignee?: boolean;
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
  // One bulk action is one event, whatever the number of tickets it changed.
  if (res.data.some((r) => r.success)) trackEvent("ticket-status-changed", { status });
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

export interface TicketParticipant {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export async function listParticipants(
  workspaceSlug: string,
  ticketId: string,
): Promise<TicketParticipant[]> {
  const res = await http.get<TicketParticipant[]>(`/workspaces/${workspaceSlug}/tickets/${ticketId}/participants`);
  return res.data;
}

export async function removeParticipant(
  workspaceSlug: string,
  ticketId: string,
  userId: string,
): Promise<void> {
  await http.delete(`/workspaces/${workspaceSlug}/tickets/${ticketId}/participants/${userId}`);
}

export async function addParticipant(
  workspaceSlug: string,
  ticketId: string,
  userId: string,
): Promise<void> {
  await http.post(`/workspaces/${workspaceSlug}/tickets/${ticketId}/participants`, { userId });
}
