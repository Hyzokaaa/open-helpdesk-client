import { http } from "@modules/app/modules/http/domain/http";

/** A workspace's own web analytics, as workspace admins manage it. */
export interface WorkspaceAnalyticsSettings {
  /** null: the workspace has no tracker of its own. */
  provider: "matomo" | null;
  serverUrl: string | null;
  siteId: string | null;
  useCookies: boolean;
  trackEvents: boolean;
  /** Whether the installation's analytics also measures this workspace's pages. */
  shareWithInstallation: boolean;
}

export async function getWorkspaceAnalyticsSettings(slug: string): Promise<WorkspaceAnalyticsSettings> {
  const res = await http.get<WorkspaceAnalyticsSettings>(`/workspaces/${slug}/analytics`);
  return res.data;
}

export async function updateWorkspaceAnalyticsSettings(slug: string, data: WorkspaceAnalyticsSettings): Promise<WorkspaceAnalyticsSettings> {
  const res = await http.patch<WorkspaceAnalyticsSettings>(`/workspaces/${slug}/analytics`, data);
  return res.data;
}
