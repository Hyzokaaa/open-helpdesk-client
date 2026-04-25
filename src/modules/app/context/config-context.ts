import { createContext } from "react";

export interface ConfigContextProps {
  saasMode: boolean;
  loading: boolean;
}

export const ConfigContext = createContext<ConfigContextProps>({
  saasMode: false,
  loading: true,
});
