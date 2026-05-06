import { http } from "@modules/app/modules/http/domain/http";

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
}

export async function listCannedResponses(workspaceSlug: string, options?: { silent?: boolean }): Promise<CannedResponse[]> {
  const res = await http.get<CannedResponse[]>(
    `/workspaces/${workspaceSlug}/canned-responses`,
    options?.silent ? { headers: { 'X-Silent-Errors': 'true' } } : undefined,
  );
  return res.data;
}

export async function createCannedResponse(
  workspaceSlug: string,
  data: { title: string; content: string },
): Promise<CannedResponse> {
  const res = await http.post<CannedResponse>(`/workspaces/${workspaceSlug}/canned-responses`, data);
  return res.data;
}

export async function updateCannedResponse(
  workspaceSlug: string,
  id: string,
  data: { title?: string; content?: string },
): Promise<CannedResponse> {
  const res = await http.put<CannedResponse>(`/workspaces/${workspaceSlug}/canned-responses/${id}`, data);
  return res.data;
}

export async function deleteCannedResponse(
  workspaceSlug: string,
  id: string,
): Promise<void> {
  await http.delete(`/workspaces/${workspaceSlug}/canned-responses/${id}`);
}
