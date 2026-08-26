import { http } from "@modules/app/modules/http/domain/http";

export interface EmailSenderDto {
  id: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  hasPassword: boolean;
  smtpFrom: string;
  encryption?: string;
  fromName?: string | null;
  fromEmail?: string | null;
}

export async function getEmailSender(slug: string): Promise<EmailSenderDto | null> {
  const res = await http.get<EmailSenderDto | null>(`/workspaces/${slug}/email-sender`, {
    headers: { 'X-Silent-Errors': 'true' },
  });
  return res.data;
}

export async function saveEmailSender(slug: string, data: {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  encryption?: string;
  fromName?: string | null;
  fromEmail?: string | null;
}): Promise<{ id: string }> {
  const res = await http.post<{ id: string }>(`/workspaces/${slug}/email-sender`, data);
  return res.data;
}

export async function deleteEmailSender(slug: string): Promise<void> {
  await http.delete(`/workspaces/${slug}/email-sender`);
}

export async function testEmailSender(slug: string, data: {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  encryption?: string;
}): Promise<{ success: boolean; error?: string }> {
  const res = await http.post<{ success: boolean; error?: string }>(`/workspaces/${slug}/email-sender/test`, data);
  return res.data;
}

export async function resolveMailServer(slug: string, domain: string): Promise<{
  smtp?: { host: string; port: number };
  imap?: { host: string; port: number };
}> {
  const res = await http.post<{ smtp?: { host: string; port: number }; imap?: { host: string; port: number } }>(
    `/workspaces/${slug}/resolve-mail-server`,
    { domain },
  );
  return res.data;
}
