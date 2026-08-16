import { http } from "@modules/app/modules/http/domain/http";

export interface SystemBranding {
  appName: string | null;
  appSubtitle: string | null;
  logo: string | null;
}

export async function getSystemBranding(): Promise<SystemBranding> {
  const res = await http.get<SystemBranding>("/admin/branding");
  return res.data;
}

export async function updateSystemBranding(data: { appName?: string | null; appSubtitle?: string | null }): Promise<SystemBranding> {
  const res = await http.patch<SystemBranding>("/admin/branding", data);
  return res.data;
}

export async function uploadSystemLogo(file: File): Promise<{ logo: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await http.post<{ logo: string }>("/admin/branding/logo", formData);
  return res.data;
}

export async function deleteSystemLogo(): Promise<void> {
  await http.delete("/admin/branding/logo");
}
