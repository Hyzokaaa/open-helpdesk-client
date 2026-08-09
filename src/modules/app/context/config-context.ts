import { createContext } from "react";

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
});
