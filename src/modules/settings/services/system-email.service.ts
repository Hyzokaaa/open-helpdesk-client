import { http } from "@modules/app/modules/http/domain/http";

export interface SystemEmailDto {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  hasPassword: boolean;
  smtpFrom: string;
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
}): Promise<{ success: boolean; error?: string }> {
  const res = await http.post<{ success: boolean; error?: string }>(
    "/system/email-settings/test",
    data,
  );
  return res.data;
}
