import { http } from "@modules/app/modules/http/domain/http";

export interface AttachmentInfo {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface AttachmentDetail extends AttachmentInfo {
  downloadUrl: string;
}

export interface AttachmentUploader {
  id: string;
  firstName: string;
  lastName: string;
}

export interface TicketAttachment extends AttachmentDetail {
  /** Decided by the backend: admins and supervisors delete any attachment, everyone else only their own. */
  canDelete: boolean;
  /** The comment it came with, or null when it belongs to the ticket itself. */
  commentId: string | null;
  createdAt: string | null;
  /** Null for files that came by email without a known sender, or whose uploader no longer exists. */
  uploadedBy: AttachmentUploader | null;
}

export interface StagedUpload {
  token: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export async function stageUpload(file: File): Promise<StagedUpload> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await http.post<StagedUpload>("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function uploadToTicket(
  workspaceId: string,
  ticketId: string,
  file: File,
): Promise<AttachmentInfo> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await http.post<AttachmentInfo>(
    `/workspaces/${workspaceId}/tickets/${ticketId}/attachments`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function uploadToComment(
  workspaceId: string,
  ticketId: string,
  commentId: string,
  file: File,
): Promise<AttachmentInfo> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await http.post<AttachmentInfo>(
    `/workspaces/${workspaceId}/tickets/${ticketId}/comments/${commentId}/attachments`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function listTicketAttachments(
  workspaceSlug: string,
  ticketId: string,
): Promise<TicketAttachment[]> {
  const res = await http.get<TicketAttachment[]>(
    `/workspaces/${workspaceSlug}/tickets/${ticketId}/attachments`,
  );
  return res.data;
}

export async function deleteAttachment(id: string): Promise<void> {
  await http.delete(`/attachments/${id}`);
}

export async function getAttachment(id: string): Promise<AttachmentDetail> {
  const res = await http.get<AttachmentDetail>(`/attachments/${id}`);
  return res.data;
}
