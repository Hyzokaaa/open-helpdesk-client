import { http } from "@modules/app/modules/http/domain/http";

export interface SystemMailboxDto {
  id: string;
  address: string;
  isActive: boolean;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  hasPassword: boolean;
  imapFolder: string;
  pollInterval: number;
  encryption: string;
  lastSyncAt: string | null;
  lastSyncDuration: number | null;
  lastError: string | null;
}

export async function getSystemMailbox(): Promise<SystemMailboxDto | null> {
  const res = await http.get<SystemMailboxDto | null>("/admin/platform-mailbox", {
    headers: { "X-Silent-Errors": "true" },
  });
  return res.data;
}

export async function saveSystemMailbox(data: {
  address: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPass: string;
  encryption?: string;
  imapFolder?: string;
  pollInterval?: number;
}): Promise<{ id: string }> {
  const res = await http.post<{ id: string }>("/admin/platform-mailbox", data);
  return res.data;
}

export async function updateSystemMailbox(data: {
  address?: string;
  imapHost?: string;
  imapPort?: number;
  imapUser?: string;
  imapPass?: string;
  encryption?: string;
  imapFolder?: string;
  pollInterval?: number;
  isActive?: boolean;
}): Promise<void> {
  await http.patch("/admin/platform-mailbox", data);
}

export async function deleteSystemMailbox(): Promise<void> {
  await http.delete("/admin/platform-mailbox");
}

export async function testSystemMailboxConnection(data: {
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPass: string;
  encryption?: string;
}): Promise<{ success: boolean; error?: string; folders?: string[] }> {
  const res = await http.post<{ success: boolean; error?: string; folders?: string[] }>(
    "/admin/platform-mailbox/test-connection",
    data,
  );
  return res.data;
}
