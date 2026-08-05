import { http } from "@modules/app/modules/http/domain/http";

export interface MailboxDto {
  id: string;
  address: string;
  type: "webhook" | "imap";
  isActive: boolean;
  imapHost?: string | null;
  imapPort?: number | null;
  imapUser?: string | null;
  hasPassword?: boolean;
  imapTls?: boolean | null;
  encryption?: string;
  imapFolder?: string | null;
  pollInterval?: number | null;
  lastSyncAt?: string | null;
  lastSyncDuration?: number | null;
  lastError?: string | null;
  addressMode?: string;
  acceptedAddresses?: string[];
  autoReply?: boolean;
}

export interface CreateMailboxRequest {
  address: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPass: string;
  imapTls?: boolean;
  encryption?: string;
  imapFolder?: string;
  pollInterval?: number;
  addressMode?: string;
  acceptedAddresses?: string[];
  autoReply?: boolean;
}

export interface UpdateMailboxRequest {
  address?: string;
  isActive?: boolean;
  imapHost?: string | null;
  imapPort?: number | null;
  imapUser?: string | null;
  imapPass?: string | null;
  imapTls?: boolean | null;
  encryption?: string;
  imapFolder?: string | null;
  pollInterval?: number | null;
  addressMode?: string;
  acceptedAddresses?: string[];
  autoReply?: boolean;
}

export async function listMailboxes(slug: string): Promise<MailboxDto[]> {
  const res = await http.get<MailboxDto[]>(`/workspaces/${slug}/mailboxes`);
  return res.data;
}

export async function createMailbox(slug: string, data: CreateMailboxRequest): Promise<MailboxDto> {
  const res = await http.post(`/workspaces/${slug}/mailboxes`, data);
  return res.data;
}

export async function updateMailbox(slug: string, id: string, data: UpdateMailboxRequest): Promise<MailboxDto> {
  const res = await http.patch(`/workspaces/${slug}/mailboxes/${id}`, data);
  return res.data;
}

export async function deleteMailbox(slug: string, id: string): Promise<void> {
  await http.delete(`/workspaces/${slug}/mailboxes/${id}`);
}

export interface TestConnectionResult {
  success: boolean;
  folders: string[];
  error?: string;
}

export async function testMailboxConnection(
  slug: string,
  data: { imapHost: string; imapPort: number; imapUser: string; imapPass: string; imapTls?: boolean; encryption?: string; mailboxId?: string },
): Promise<TestConnectionResult> {
  const res = await http.post(`/workspaces/${slug}/mailboxes/test-connection`, data);
  return res.data;
}

export async function importMailboxEmails(
  slug: string,
  id: string,
  since?: string | null,
): Promise<{ processed: number; total: number }> {
  const res = await http.post<{ processed: number; total: number }>(
    `/workspaces/${slug}/mailboxes/${id}/import`,
    { since: since || undefined },
  );
  return res.data;
}

export async function pollMailboxNow(
  slug: string,
  id: string,
): Promise<{ processed: number; total: number }> {
  const res = await http.post<{ processed: number; total: number }>(
    `/workspaces/${slug}/mailboxes/${id}/poll-now`,
  );
  return res.data;
}

export async function pauseMailbox(slug: string, id: string): Promise<void> {
  await http.post(`/workspaces/${slug}/mailboxes/${id}/pause`);
}

export async function resumeMailbox(slug: string, id: string): Promise<void> {
  await http.post(`/workspaces/${slug}/mailboxes/${id}/resume`);
}
