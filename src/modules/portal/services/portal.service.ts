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

export interface CreatePortalTicketData {
  name: string;
  email: string;
  subject: string;
  description: string;
  uploadTokens?: string[];
  customFields?: Record<string, unknown>;
}

export interface CreatePortalTicketResponse {
  ticketNumber: number;
  message: string;
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
