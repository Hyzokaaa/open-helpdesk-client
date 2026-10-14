import type { ConnectionErrorCode } from "@modules/workspace/components/ConnectionTestResult";
import { http } from "@modules/app/modules/http/domain/http";
import type { ResolvedServers } from "@modules/shared/domain/mail-server-suggestion";

export interface SystemEmailDto {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  hasPassword: boolean;
  smtpFrom: string;
  encryption?: string;
}

export interface SystemEmailResponse {
  settings: SystemEmailDto | null;
  envConfigured: boolean;
}

export async function getSystemEmail(): Promise<SystemEmailResponse> {
  const res = await http.get<SystemEmailResponse>("/system/email-settings", {
    headers: { "X-Silent-Errors": "true" },
  });
  return res.data;
}

export async function saveSystemEmail(data: {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  encryption?: string;
}): Promise<void> {
  await http.post("/system/email-settings", data);
}

export async function deleteSystemEmail(): Promise<void> {
  await http.delete("/system/email-settings");
}

export async function testSystemEmail(data: {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  encryption?: string;
}): Promise<{ success: boolean; error?: string; errorCode?: ConnectionErrorCode }> {
  const res = await http.post<{ success: boolean; error?: string; errorCode?: ConnectionErrorCode }>(
    "/system/email-settings/test",
    data,
  );
  return res.data;
}

/** The mail servers of a domain, for the installation's email and platform mailbox forms */
export async function resolveSystemMailServer(domain: string): Promise<ResolvedServers> {
  const res = await http.post<ResolvedServers>("/system/resolve-mail-server", { domain });
  return res.data;
}
