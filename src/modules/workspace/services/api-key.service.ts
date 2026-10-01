import { http } from "@modules/app/modules/http/domain/http";

export interface ApiKeyDto {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  prefix: string;
  key: string;
  scopes: string[];
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateApiKeyPayload {
  name: string;
  scopes?: string[];
  expiresAt?: string;
}

export const API_KEY_SCOPES = [
  "tickets:read",
  "tickets:write",
  "comments:read",
  "comments:write",
  "members:read",
  "auth:exchange",
  "auth:exchange:admin",
] as const;

export const ADMIN_EXCHANGE_SCOPE = "auth:exchange:admin";

/** Pre-selected for a new key. Acting as an admin is never on by default. */
export const DEFAULT_API_KEY_SCOPES: string[] = API_KEY_SCOPES.filter((s) => s !== ADMIN_EXCHANGE_SCOPE);

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export async function listApiKeys(slug: string): Promise<ApiKeyDto[]> {
  const res = await http.get<ApiKeyDto[]>(`/workspaces/${slug}/api-keys`);
  return res.data;
}

export async function createApiKey(slug: string, payload: CreateApiKeyPayload): Promise<CreateApiKeyResponse> {
  const res = await http.post<CreateApiKeyResponse>(`/workspaces/${slug}/api-keys`, payload);
  return res.data;
}

export async function deleteApiKey(slug: string, id: string): Promise<void> {
  await http.delete(`/workspaces/${slug}/api-keys/${id}`);
}
