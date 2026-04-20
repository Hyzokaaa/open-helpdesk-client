import { http } from "@modules/app/modules/http/domain/http";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  role: string;
}

export interface WorkspaceDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export async function listUsers(): Promise<UserListItem[]> {
  const res = await http.get<UserListItem[]>("/users");
  return res.data;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const res = await http.get<Workspace[]>("/workspaces");
  return res.data;
}

export async function getWorkspace(slug: string): Promise<WorkspaceDetail> {
  const res = await http.get<WorkspaceDetail>(`/workspaces/${slug}`);
  return res.data;
}

export async function createWorkspace(data: {
  name: string;
  description: string;
}): Promise<{ id: string; name: string; slug: string }> {
  const res = await http.post("/workspaces", data);
  return res.data;
}

export async function listMembers(slug: string): Promise<WorkspaceMember[]> {
  const res = await http.get<WorkspaceMember[]>(
    `/workspaces/${slug}/members`,
  );
  return res.data;
}

export async function addMember(
  slug: string,
  data: { userId: string; role: string },
): Promise<WorkspaceMember> {
  const res = await http.post<WorkspaceMember>(
    `/workspaces/${slug}/members`,
    data,
  );
  return res.data;
}

export async function removeMember(
  slug: string,
  userId: string,
): Promise<void> {
  await http.delete(`/workspaces/${slug}/members/${userId}`);
}
