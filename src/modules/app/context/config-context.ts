import { createContext } from "react";

export interface DomainWorkspace {
  slug: string;
  name: string;
  palette: string | null;
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
  loading: boolean;
  /** Custom domain mode: null = normal SaaS, array = filtered to these workspaces */
  domainWorkspaces: DomainWorkspace[] | null;
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
  loading: true,
  domainWorkspaces: null,
});
