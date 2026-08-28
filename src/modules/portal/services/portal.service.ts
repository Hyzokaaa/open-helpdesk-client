import axios from "axios";
import { API_URL } from "@modules/app/domain/constants/env";

const portalHttp = axios.create({ baseURL: API_URL });

export interface PortalInfo {
  name: string;
  slug: string;
  palette: string | null;
}

export interface PortalCustomField {
  id: string;
  name: string;
  type: "text" | "number" | "select" | "multi-select" | "date" | "checkbox";
  required: boolean;
  options: string[] | null;
}

export interface PortalDepartment {
  id: string;
  name: string;
}

export interface CreatePortalTicketData {
  name: string;
  email: string;
  subject: string;
  description: string;
  uploadTokens?: string[];
  customFields?: Record<string, unknown>;
  departmentId?: string;
}

export interface CreatePortalTicketResponse {
  ticketNumber: number;
  portalToken: string;
  message: string;
}

export interface PortalTicketComment {
  id: string;
  content: string;
  authorName: string;
  isCreator: boolean;
  createdAt: string;
}

export interface PortalTicketAttachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
}

export interface PortalTicketDetail {
  ticketNumber: number;
  name: string;
  description: string;
  status: string;
  priority: string;
  categoryName: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  creatorName: string;
  workspaceName: string;
  workspacePalette: string | null;
  attachments: PortalTicketAttachment[];
  comments: PortalTicketComment[];
}

export interface PortalStagedUpload {
  token: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export async function getPortalInfo(slug: string): Promise<PortalInfo> {
  const res = await portalHttp.get<PortalInfo>(`/portal/${slug}`);
  return res.data;
}

export async function getPortalCustomFields(slug: string): Promise<PortalCustomField[]> {
  const res = await portalHttp.get<PortalCustomField[]>(`/portal/${slug}/custom-fields`);
  return res.data;
}

export async function getPortalDepartments(slug: string): Promise<PortalDepartment[]> {
  const res = await portalHttp.get<PortalDepartment[]>(`/portal/${slug}/departments`);
  return res.data;
}

export async function createPortalTicket(
  slug: string,
  data: CreatePortalTicketData,
): Promise<CreatePortalTicketResponse> {
  const res = await portalHttp.post<CreatePortalTicketResponse>(
    `/portal/${slug}/tickets`,
    data,
  );
  return res.data;
}

export async function getPortalTicket(portalToken: string): Promise<PortalTicketDetail> {
  const res = await portalHttp.get<PortalTicketDetail>(`/portal/tickets/${portalToken}`);
  return res.data;
}

export async function addPortalComment(portalToken: string, content: string): Promise<void> {
  await portalHttp.post(`/portal/tickets/${portalToken}/comments`, { content });
}

// Knowledge Base (public)

export interface PortalKbCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  articleCount: number;
}

export interface PortalKbArticlePreview {
  id: string;
  title: string;
  slug: string;
  content: string;
}

export interface PortalKbArticleDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: { name: string; slug: string } | null;
}

export async function getPortalKbCategories(slug: string): Promise<PortalKbCategory[]> {
  const res = await portalHttp.get<PortalKbCategory[]>(`/portal/${slug}/kb/categories`);
  return res.data;
}

export async function getPortalKbArticles(slug: string, categorySlug: string): Promise<PortalKbArticlePreview[]> {
  const res = await portalHttp.get<PortalKbArticlePreview[]>(`/portal/${slug}/kb/categories/${categorySlug}/articles`);
  return res.data;
}

export async function getPortalKbArticle(slug: string, articleSlug: string): Promise<PortalKbArticleDetail> {
  const res = await portalHttp.get<PortalKbArticleDetail>(`/portal/${slug}/kb/articles/${articleSlug}`);
  return res.data;
}

export async function searchPortalKb(slug: string, query: string): Promise<PortalKbArticlePreview[]> {
  const res = await portalHttp.get<PortalKbArticlePreview[]>(`/portal/${slug}/kb/search`, { params: { q: query } });
  return res.data;
}

export async function portalStageUpload(
  slug: string,
  file: File,
): Promise<PortalStagedUpload> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await portalHttp.post<PortalStagedUpload>(
    `/portal/${slug}/uploads`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}
