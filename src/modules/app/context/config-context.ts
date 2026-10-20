import { createContext } from "react";
import { APP_NAME, APP_SUBTITLE } from "../domain/constants/env";
import type { AnalyticsConfig } from "@modules/analytics/domain/analytics-config";

export interface DomainWorkspace {
  slug: string;
  name: string;
  palette: string | null;
  appName: string | null;
  appSubtitle: string | null;
  logo: string | null;
  icon: string | null;
  /** What the domain shows someone signed out; missing on older servers (open) */
  portalEnabled?: boolean;
  publicKbEnabled?: boolean;
}

export interface ConfigContextProps {
  saasMode: boolean;
  paymentGateways: string[];
  defaultGateway: string;
  paddleClientToken: string | null;
  paddleEnvironment: string;
  aiEnabled: boolean;
  emailConfigured: boolean;
  sessionRememberDays: number | null;
  /** The installation's own address, through which custom domains pick up the session (#37). */
  appUrl: string | null;
  systemEmailFrom: string | null;
  upgradeNotificationsEnabled: boolean;
  /** Web analytics for this installation, or null when it is off. */
  analytics: AnalyticsConfig | null;
  loading: boolean;
  /** Custom domain mode: null = normal SaaS, array = filtered to these workspaces */
  domainWorkspaces: DomainWorkspace[] | null;
  /** Takes a workspace's new portal settings, saved in this tab, without reloading the page */
  updateDomainWorkspaceAccess: (slug: string, access: { portalEnabled: boolean; publicKbEnabled: boolean }) => void;
  brandName: string;
  /** The installation's own name (system branding), never a workspace's: who runs its analytics. */
  installationName: string;
  brandSubtitle: string;
  brandLogo: string | null;
  brandIcon: string | null;
}

export const ConfigContext = createContext<ConfigContextProps>({
  saasMode: false,
  paymentGateways: [],
  defaultGateway: "",
  paddleClientToken: null,
  paddleEnvironment: "sandbox",
  aiEnabled: false,
  emailConfigured: false,
  sessionRememberDays: null,
  appUrl: null,
  systemEmailFrom: null,
  upgradeNotificationsEnabled: true,
  analytics: null,
  loading: true,
  domainWorkspaces: null,
  updateDomainWorkspaceAccess: () => {},
  brandName: APP_NAME,
  installationName: [APP_NAME, APP_SUBTITLE].filter(Boolean).join(" "),
  brandSubtitle: APP_SUBTITLE,
  brandLogo: null,
  brandIcon: null,
});
