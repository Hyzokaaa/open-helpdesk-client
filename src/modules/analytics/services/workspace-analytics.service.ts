import axios from "axios";
import { API_URL } from "@modules/app/domain/constants/env";
import { getPortalInfo } from "@modules/portal/services/portal.service";
import { parseAnalyticsConfig } from "../domain/analytics-config";
import type { WorkspaceAnalytics } from "../domain/analytics";

/** Public and silent: no session, no error toasts, whoever the visitor is. */
const publicHttp = axios.create({ baseURL: API_URL });

interface PublicWorkspaceAnalytics {
  analytics: unknown;
  shareWithInstallation: unknown;
}

/** What the domain resolution already knows about a workspace. */
interface KnownWorkspace {
  slug: string;
  name: string;
}

/**
 * A workspace's analytics from `GET /workspaces/:slug/analytics/public`, re-validated like the
 * installation's (it decides where hits go). A 404 (unknown slug, or a backend without
 * per-workspace analytics) means no workspace tracker and sharing on, the default. Any other
 * failure means no workspace tracker and nothing shared on the workspace's behalf, since its
 * choice could not be read.
 *
 * The name is only looked up when visitors will be told about this workspace's analytics: from
 * the custom domain's workspaces, else the public portal info.
 */
export async function loadWorkspaceAnalytics(slug: string, known: readonly KnownWorkspace[] | null): Promise<WorkspaceAnalytics> {
  let analytics: WorkspaceAnalytics["analytics"];
  let shareWithInstallation: boolean;
  try {
    const res = await publicHttp.get<PublicWorkspaceAnalytics>(`/workspaces/${encodeURIComponent(slug)}/analytics/public`);
    analytics = parseAnalyticsConfig(res.data?.analytics);
    shareWithInstallation = res.data?.shareWithInstallation !== false;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return { analytics: null, shareWithInstallation: true, name: null };
    }
    return { analytics: null, shareWithInstallation: false, name: null };
  }

  let name: string | null = null;
  if (analytics || !shareWithInstallation) {
    name = known?.find((w) => w.slug === slug)?.name ?? null;
    if (!name) {
      try {
        name = (await getPortalInfo(slug)).name || null;
      } catch {
        name = null;
      }
    }
  }
  return { analytics, shareWithInstallation, name };
}
