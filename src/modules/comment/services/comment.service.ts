import { http } from "@modules/app/modules/http/domain/http";
import { PaginatedResult } from "@modules/shared/domain/pagination-result";
import type { PersonSummary } from "@modules/shared/domain/person-summary";
import { trackEvent } from "@modules/analytics/domain/analytics";

export interface CommentItem {
  id: string;
  content: string;
  authorId: string;
  mentionedUserIds: string[];
  createdAt: string | null;
  editedAt: string | null;
  author?: PersonSummary | null;
  /** Lines of quoted text folded under an emailed reply (its quote and signature). */
  quotedLines?: number;
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

/** The quoted message and signature an emailed reply carried. */
export async function getCommentQuotedText(workspaceId: string, ticketId: string, commentId: string): Promise<string> {
  const res = await http.get<{ content: string }>(
    `/workspaces/${workspaceId}/tickets/${ticketId}/comments/${commentId}/quoted-text`,
  );
  return res.data.content;
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
  /** Files uploaded beforehand with stageUpload, attached to the new comment. */
  uploadTokens: string[] = [],
): Promise<CommentItem> {
  const res = await http.post<CommentItem>(
    `/workspaces/${workspaceId}/tickets/${ticketId}/comments`,
    uploadTokens.length > 0 ? { content, uploadTokens } : { content },
  );
  // The client has no internal notes: every comment is visible to the reporter.
  trackEvent("comment-created", { visibility: "public" });
  return res.data;
}
