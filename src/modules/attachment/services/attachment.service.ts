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
): Promise<AttachmentDetail[]> {
  const res = await http.get<AttachmentDetail[]>(
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
