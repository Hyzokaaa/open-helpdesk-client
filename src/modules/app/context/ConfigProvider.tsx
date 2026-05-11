import { useEffect, useState, type ReactNode } from "react";
import { ConfigContext } from "./config-context";
import { getPublicConfig } from "../services/config.service";

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [saasMode, setSaasMode] = useState(false);
  const [paymentGateways, setPaymentGateways] = useState<string[]>([]);
  const [defaultGateway, setDefaultGateway] = useState("");
  const [paddleClientToken, setPaddleClientToken] = useState<string | null>(null);
  const [paddleEnvironment, setPaddleEnvironment] = useState("sandbox");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicConfig()
      .then((config) => {
        setSaasMode(config.saasMode);
        setPaymentGateways(config.paymentGateways ?? []);
        setDefaultGateway(config.defaultGateway ?? "");
        setPaddleClientToken(config.paddleClientToken ?? null);
        setPaddleEnvironment(config.paddleEnvironment ?? "sandbox");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ConfigContext.Provider value={{ saasMode, paymentGateways, defaultGateway, paddleClientToken, paddleEnvironment, loading }}>
      {children}
    </ConfigContext.Provider>
  );
}
