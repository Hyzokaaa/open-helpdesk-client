import { http } from "@modules/app/modules/http/domain/http";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  categoryCount?: number;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  categories: TicketCategoryDto[];
}

export interface TicketCategoryDto {
  id: string;
  name: string;
  slug: string;
  color: string;
  inProject?: boolean | null;
}

export async function listProjects(slug: string): Promise<Project[]> {
  const res = await http.get<Project[]>(`/workspaces/${slug}/projects`);
  return res.data;
}

export async function getProject(slug: string, id: string): Promise<ProjectDetail> {
  const res = await http.get<ProjectDetail>(`/workspaces/${slug}/projects/${id}`);
  return res.data;
}

export async function createProject(slug: string, data: { name: string; description?: string }): Promise<Project> {
  const res = await http.post<Project>(`/workspaces/${slug}/projects`, data);
  return res.data;
}

export async function updateProject(slug: string, id: string, data: { name?: string; description?: string | null }): Promise<Project> {
  const res = await http.patch<Project>(`/workspaces/${slug}/projects/${id}`, data);
  return res.data;
}

export async function deleteProject(slug: string, id: string): Promise<void> {
  await http.delete(`/workspaces/${slug}/projects/${id}`);
}

export async function addProjectCategory(slug: string, projectId: string, categoryId: string): Promise<void> {
  await http.post(`/workspaces/${slug}/projects/${projectId}/categories`, { categoryId });
}

export async function removeProjectCategory(slug: string, projectId: string, categoryId: string): Promise<void> {
  await http.delete(`/workspaces/${slug}/projects/${projectId}/categories/${categoryId}`);
}

export async function listProjectCategories(slug: string, projectId: string): Promise<TicketCategoryDto[]> {
  const res = await http.get<TicketCategoryDto[]>(`/workspaces/${slug}/projects/${projectId}/categories`);
  return res.data;
}

// Workspace-level categories
export async function listCategories(slug: string, projectId?: string): Promise<TicketCategoryDto[]> {
  const params = projectId ? `?projectId=${projectId}` : "";
  const res = await http.get<TicketCategoryDto[]>(`/workspaces/${slug}/categories${params}`);
  return res.data;
}

export async function createCategory(slug: string, data: { name: string; slug: string; color?: string }): Promise<TicketCategoryDto> {
  const res = await http.post<TicketCategoryDto>(`/workspaces/${slug}/categories`, data);
  return res.data;
}

export async function updateCategory(slug: string, id: string, data: { name?: string; slug?: string; color?: string }): Promise<TicketCategoryDto> {
  const res = await http.patch<TicketCategoryDto>(`/workspaces/${slug}/categories/${id}`, data);
  return res.data;
}

export async function deleteCategory(slug: string, id: string): Promise<void> {
  await http.delete(`/workspaces/${slug}/categories/${id}`);
}
