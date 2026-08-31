import { createContext } from "react";
import { APP_NAME, APP_SUBTITLE } from "../domain/constants/env";

export interface DomainWorkspace {
  slug: string;
  name: string;
  palette: string | null;
  appName: string | null;
  appSubtitle: string | null;
  logo: string | null;
}

export interface ConfigContextProps {
  saasMode: boolean;
  paymentGateways: string[];
  defaultGateway: string;
  paddleClientToken: string | null;
  paddleEnvironment: string;
  aiEnabled: boolean;
  emailConfigured: boolean;
  systemEmailFrom: string | null;
  upgradeNotificationsEnabled: boolean;
  loading: boolean;
  /** Custom domain mode: null = normal SaaS, array = filtered to these workspaces */
  domainWorkspaces: DomainWorkspace[] | null;
  brandName: string;
  brandSubtitle: string;
  brandLogo: string | null;
}

export const ConfigContext = createContext<ConfigContextProps>({
  saasMode: false,
  paymentGateways: [],
  defaultGateway: "",
  paddleClientToken: null,
  paddleEnvironment: "sandbox",
  aiEnabled: false,
  emailConfigured: false,
  systemEmailFrom: null,
  upgradeNotificationsEnabled: true,
  loading: true,
  domainWorkspaces: null,
  brandName: APP_NAME,
  brandSubtitle: APP_SUBTITLE,
  brandLogo: null,
});
