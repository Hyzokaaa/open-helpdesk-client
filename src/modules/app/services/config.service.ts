import { http } from "@modules/app/modules/http/domain/http";
import type { AnalyticsConfig } from "@modules/analytics/domain/analytics-config";

export interface PublicConfig {
  saasMode: boolean;
  paymentGateways: string[];
  defaultGateway: string;
  paddleClientToken: string | null;
  paddleEnvironment: string;
  aiEnabled: boolean;
  emailConfigured: boolean;
  /** How long "keep me signed in" lasts; missing on older servers */
  sessionRememberDays?: number | null;
  /** The installation's own address (FRONTEND_URL); missing on older servers */
  appUrl?: string | null;
  systemEmailFrom: string | null;
  brandingAppName: string | null;
  brandingAppSubtitle: string | null;
  brandingLogo: string | null;
  brandingIcon: string | null;
  upgradeNotificationsEnabled: boolean;
  /** Web analytics for this installation, or null when it is off. */
  analytics: AnalyticsConfig | null;
}

export async function getPublicConfig(): Promise<PublicConfig> {
  try {
    const res = await http.get<PublicConfig>("/config/public");
    return res.data;
  } catch {
    return { saasMode: false, paymentGateways: [], defaultGateway: "", paddleClientToken: null, paddleEnvironment: "sandbox", aiEnabled: false, emailConfigured: false, systemEmailFrom: null, brandingAppName: null, brandingAppSubtitle: null, brandingLogo: null, brandingIcon: null, upgradeNotificationsEnabled: true, analytics: null };
  }
}

export interface ResolvedWorkspace {
  slug: string;
  name: string;
  palette: string | null;
  appName: string | null;
  appSubtitle: string | null;
  logo: string | null;
  icon: string | null;
  portalEnabled?: boolean;
  publicKbEnabled?: boolean;
}

/**
 * Whether this page is served on the installation's own address (FRONTEND_URL), which is never a
 * workspace's custom domain. False when the server does not say (older servers): ask, as before.
 */
export function isInstallationAddress(appUrl: string | null | undefined): boolean {
  if (!appUrl) return false;
  try {
    return new URL(appUrl).origin === window.location.origin;
  } catch {
    return false;
  }
}

export async function resolveDomain(host: string): Promise<ResolvedWorkspace[] | null> {
  try {
    const res = await http.get<{ workspaces: ResolvedWorkspace[] }>(`/internal/resolve-domain?host=${encodeURIComponent(host)}`);
    return res.data.workspaces.length > 0 ? res.data.workspaces : null;
  } catch {
    return null;
  }
}
