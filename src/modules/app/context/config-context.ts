import { createContext } from "react";

export interface ConfigContextProps {
  saasMode: boolean;
  paymentGateways: string[];
  defaultGateway: string;
  paddleClientToken: string | null;
  paddleEnvironment: string;
  loading: boolean;
}

export const ConfigContext = createContext<ConfigContextProps>({
  saasMode: false,
  paymentGateways: [],
  defaultGateway: "",
  paddleClientToken: null,
  paddleEnvironment: "sandbox",
  loading: true,
});
