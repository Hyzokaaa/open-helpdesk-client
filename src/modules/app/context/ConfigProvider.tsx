import { useEffect, useState, type ReactNode } from "react";
import { ConfigContext } from "./config-context";
import { getPublicConfig } from "../services/config.service";

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [saasMode, setSaasMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicConfig()
      .then((config) => setSaasMode(config.saasMode))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ConfigContext.Provider value={{ saasMode, loading }}>
      {children}
    </ConfigContext.Provider>
  );
}
