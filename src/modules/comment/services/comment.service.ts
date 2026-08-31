import { http } from "@modules/app/modules/http/domain/http";
import { PaginatedResult } from "@modules/shared/domain/pagination-result";

export interface CommentItem {
  id: string;
  content: string;
  authorId: string;
  mentionedUserIds: string[];
  createdAt: string | null;
  editedAt: string | null;
}

export interface CommentEditItem {
  id: string;
  content: string;
  editedById: string;
  createdAt: string;
}

export async function listComments(
  workspaceId: string,
  ticketId: string,
  page = 1,
  limit = 50,
): Promise<PaginatedResult<CommentItem>> {
  const res = await http.get<PaginatedResult<CommentItem>>(
    `/workspaces/${workspaceId}/tickets/${ticketId}/comments?page=${page}&limit=${limit}`,
  );
  return res.data;
}

export async function editComment(
  workspaceId: string,
  ticketId: string,
  commentId: string,
  content: string,
): Promise<CommentItem> {
  const res = await http.patch<CommentItem>(
    `/workspaces/${workspaceId}/tickets/${ticketId}/comments/${commentId}`,
    { content },
  );
  return res.data;
}

export async function getCommentHistory(
  workspaceId: string,
  ticketId: string,
  commentId: string,
): Promise<CommentEditItem[]> {
  const res = await http.get<CommentEditItem[]>(
    `/workspaces/${workspaceId}/tickets/${ticketId}/comments/${commentId}/history`,
  );
  return res.data;
}

export async function createComment(
  workspaceId: string,
  ticketId: string,
  content: string,
): Promise<CommentItem> {
  const res = await http.post<CommentItem>(
    `/workspaces/${workspaceId}/tickets/${ticketId}/comments`,
    { content },
  );
  return res.data;
}
