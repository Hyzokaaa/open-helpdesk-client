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
  actions?: string[];
  entityTypes?: string[];
  entityId?: string;
  categories?: string[];
  levels?: string[];
  sources?: string[];
  userIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortOrder?: "ASC" | "DESC";
  page?: number;
  limit?: number;
}

function applyFilters(params: URLSearchParams, filters: AuditLogFilters): void {
  if (filters.actions?.length) params.set("actions", filters.actions.join(","));
  if (filters.entityTypes?.length) params.set("entityTypes", filters.entityTypes.join(","));
  if (filters.entityId) params.set("entityId", filters.entityId);
  if (filters.categories?.length) params.set("categories", filters.categories.join(","));
  if (filters.levels?.length) params.set("levels", filters.levels.join(","));
  if (filters.sources?.length) params.set("sources", filters.sources.join(","));
  if (filters.userIds?.length) params.set("userIds", filters.userIds.join(","));
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 20));
}

export async function listAuditLog(
  workspaceSlug: string,
  filters: AuditLogFilters = {},
  options?: { silent?: boolean },
): Promise<PaginatedResult<AuditLogItem>> {
  const params = new URLSearchParams();
  applyFilters(params, filters);

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
  applyFilters(params, filters);

  const res = await http.get<PaginatedResult<AuditLogItem>>(
    `/admin/audit-log?${params}`,
  );
  return res.data;
}
