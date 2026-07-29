import { http } from "@modules/app/modules/http/domain/http";

export interface KbCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  position: number;
}

export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  position: number;
  categoryId: string;
}

export interface KbArticleListItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  position: number;
  categoryId: string;
}

export async function listCategories(slug: string): Promise<KbCategory[]> {
  const res = await http.get<KbCategory[]>(`/workspaces/${slug}/kb/categories`);
  return res.data;
}

export async function createCategory(slug: string, data: { name: string; icon?: string }): Promise<KbCategory> {
  const res = await http.post<KbCategory>(`/workspaces/${slug}/kb/categories`, data);
  return res.data;
}

export async function updateCategory(slug: string, id: string, data: { name?: string; icon?: string | null }): Promise<KbCategory> {
  const res = await http.put<KbCategory>(`/workspaces/${slug}/kb/categories/${id}`, data);
  return res.data;
}

export async function deleteCategory(slug: string, id: string): Promise<void> {
  await http.delete(`/workspaces/${slug}/kb/categories/${id}`);
}

export async function reorderCategories(slug: string, ids: string[]): Promise<void> {
  await http.put(`/workspaces/${slug}/kb/categories/reorder`, { ids });
}

export async function listArticles(slug: string): Promise<KbArticleListItem[]> {
  const res = await http.get<KbArticleListItem[]>(`/workspaces/${slug}/kb/articles`);
  return res.data;
}

export async function getArticle(slug: string, id: string): Promise<KbArticle> {
  const res = await http.get<KbArticle>(`/workspaces/${slug}/kb/articles/${id}`);
  return res.data;
}

export async function createArticle(slug: string, data: { title: string; content: string; categoryId: string; status?: string }): Promise<KbArticleListItem> {
  const res = await http.post<KbArticleListItem>(`/workspaces/${slug}/kb/articles`, data);
  return res.data;
}

export async function updateArticle(slug: string, id: string, data: { title?: string; content?: string; status?: string; categoryId?: string }): Promise<KbArticleListItem> {
  const res = await http.put<KbArticleListItem>(`/workspaces/${slug}/kb/articles/${id}`, data);
  return res.data;
}

export async function deleteArticle(slug: string, id: string): Promise<void> {
  await http.delete(`/workspaces/${slug}/kb/articles/${id}`);
}

export async function suggestArticles(slug: string, query: string): Promise<Array<{ id: string; title: string; slug: string }>> {
  const res = await http.get<Array<{ id: string; title: string; slug: string }>>(`/workspaces/${slug}/kb/articles/suggest`, { params: { q: query } });
  return res.data;
}
