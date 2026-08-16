import { useEffect, useState, type ReactNode } from "react";
import { ConfigContext, type DomainWorkspace } from "./config-context";
import { getPublicConfig, resolveDomain } from "../services/config.service";

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [saasMode, setSaasMode] = useState(false);
  const [paymentGateways, setPaymentGateways] = useState<string[]>([]);
  const [defaultGateway, setDefaultGateway] = useState("");
  const [paddleClientToken, setPaddleClientToken] = useState<string | null>(null);
  const [paddleEnvironment, setPaddleEnvironment] = useState("sandbox");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [systemEmailFrom, setSystemEmailFrom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainWorkspaces, setDomainWorkspaces] = useState<DomainWorkspace[] | null>(null);

  useEffect(() => {
    const init = async () => {
      const config = await getPublicConfig();
      setSaasMode(config.saasMode);
      setPaymentGateways(config.paymentGateways ?? []);
      setDefaultGateway(config.defaultGateway ?? "");
      setPaddleClientToken(config.paddleClientToken ?? null);
      setPaddleEnvironment(config.paddleEnvironment ?? "sandbox");
      setAiEnabled(config.aiEnabled ?? false);
      setEmailConfigured(config.emailConfigured ?? false);
      setSystemEmailFrom(config.systemEmailFrom ?? null);

      // Always try to resolve — backend returns 404 if hostname has no verified custom domain
      const resolved = await resolveDomain(window.location.hostname);
      if (resolved) setDomainWorkspaces(resolved);
    };
    init().finally(() => setLoading(false));
  }, []);

  return (
    <ConfigContext.Provider value={{ saasMode, paymentGateways, defaultGateway, paddleClientToken, paddleEnvironment, aiEnabled, emailConfigured, systemEmailFrom, loading, domainWorkspaces }}>
      {children}
    </ConfigContext.Provider>
  );
}
