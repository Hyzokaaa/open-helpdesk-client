import { http } from "@modules/app/modules/http/domain/http";
import { PaginatedResult } from "@modules/shared/domain/pagination-result";

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string | null;
  userName?: string | null;
  workspaceId: string | null;
  category: string;
  level: string;
  source: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  excludeActions?: string[];
  entityType?: string;
  entityId?: string;
  category?: string;
  level?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  sortOrder?: "ASC" | "DESC";
  page?: number;
  limit?: number;
}

export async function listAuditLog(
  workspaceSlug: string,
  filters: AuditLogFilters = {},
  options?: { silent?: boolean },
): Promise<PaginatedResult<AuditLogItem>> {
  const params = new URLSearchParams();
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.action) params.set("action", filters.action);
  if (filters.excludeActions?.length) params.set("excludeActions", filters.excludeActions.join(","));
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.entityId) params.set("entityId", filters.entityId);
  if (filters.category) params.set("category", filters.category);
  if (filters.level) params.set("level", filters.level);
  if (filters.source) params.set("source", filters.source);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 20));

  const res = await http.get<PaginatedResult<AuditLogItem>>(
    `/workspaces/${workspaceSlug}/audit-log?${params}`,
    options?.silent ? { headers: { 'X-Silent-Errors': 'true' } } : undefined,
  );
  return res.data;
}

export async function listAllAuditLog(
  filters: AuditLogFilters = {},
): Promise<PaginatedResult<AuditLogItem>> {
  const params = new URLSearchParams();
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.action) params.set("action", filters.action);
  if (filters.excludeActions?.length) params.set("excludeActions", filters.excludeActions.join(","));
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.entityId) params.set("entityId", filters.entityId);
  if (filters.category) params.set("category", filters.category);
  if (filters.level) params.set("level", filters.level);
  if (filters.source) params.set("source", filters.source);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 20));

  const res = await http.get<PaginatedResult<AuditLogItem>>(
    `/admin/audit-log?${params}`,
  );
  return res.data;
}
