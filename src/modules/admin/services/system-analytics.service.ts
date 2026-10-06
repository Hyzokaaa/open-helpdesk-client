import { http } from "@modules/app/modules/http/domain/http";

export interface SystemAnalytics {
  /** null: analytics off. */
  provider: "matomo" | null;
  serverUrl: string | null;
  siteId: string | null;
  useCookies: boolean;
  trackEvents: boolean;
}

export async function getSystemAnalytics(): Promise<SystemAnalytics> {
  const res = await http.get<SystemAnalytics>("/admin/analytics");
  return res.data;
}

export async function updateSystemAnalytics(data: SystemAnalytics): Promise<SystemAnalytics> {
  const res = await http.patch<SystemAnalytics>("/admin/analytics", data);
  return res.data;
}
