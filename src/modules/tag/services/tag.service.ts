import { http } from "@modules/app/modules/http/domain/http";

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export async function listTags(workspaceId: string): Promise<Tag[]> {
  const res = await http.get<Tag[]>(`/workspaces/${workspaceId}/tags`);
  return res.data;
}

export async function createTag(
  workspaceId: string,
  data: { name: string; color?: string },
): Promise<Tag> {
  const res = await http.post<Tag>(`/workspaces/${workspaceId}/tags`, data);
  return res.data;
}

export async function deleteTag(
  workspaceId: string,
  tagId: string,
): Promise<void> {
  await http.delete(`/workspaces/${workspaceId}/tags/${tagId}`);
}
