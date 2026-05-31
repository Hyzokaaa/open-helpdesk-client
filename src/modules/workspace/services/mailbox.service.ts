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
  imapFolder?: string | null;
  pollInterval?: number | null;
  lastSyncAt?: string | null;
  lastError?: string | null;
}

export interface CreateMailboxRequest {
  address: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPass: string;
  imapTls?: boolean;
  imapFolder?: string;
  pollInterval?: number;
}

export interface UpdateMailboxRequest {
  address?: string;
  isActive?: boolean;
  imapHost?: string | null;
  imapPort?: number | null;
  imapUser?: string | null;
  imapPass?: string | null;
  imapTls?: boolean | null;
  imapFolder?: string | null;
  pollInterval?: number | null;
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
  data: { imapHost: string; imapPort: number; imapUser: string; imapPass: string; imapTls?: boolean },
): Promise<TestConnectionResult> {
  const res = await http.post(`/workspaces/${slug}/mailboxes/test-connection`, data);
  return res.data;
}
