import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ConfigContext, type DomainWorkspace } from "./config-context";
import { getPublicConfig, resolveDomain } from "../services/config.service";
import { APP_NAME, APP_SUBTITLE } from "../domain/constants/env";

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

  const { brandName, brandSubtitle, brandLogo } = useMemo(() => {
    const source = domainWorkspaces?.find((ws) => ws.appName) ?? null;
    if (!source || !source.appName) {
      return { brandName: APP_NAME, brandSubtitle: APP_SUBTITLE, brandLogo: null as string | null };
    }

    const fullName = source.appName;
    const endsWithHelpdesk = fullName.toLowerCase().endsWith("helpdesk");
    const name = endsWithHelpdesk ? fullName.replace(/\s*[Hh]elpdesk$/, "") : fullName;
    const subtitle = source.appSubtitle ?? (endsWithHelpdesk ? "Helpdesk" : "");

    return { brandName: name, brandSubtitle: subtitle, brandLogo: source.logo };
  }, [domainWorkspaces]);

  useEffect(() => {
    document.title = brandSubtitle ? `${brandName} ${brandSubtitle}` : brandName;
  }, [brandName, brandSubtitle]);

  return (
    <ConfigContext.Provider value={{ saasMode, paymentGateways, defaultGateway, paddleClientToken, paddleEnvironment, aiEnabled, emailConfigured, systemEmailFrom, loading, domainWorkspaces, brandName, brandSubtitle, brandLogo }}>
      {children}
    </ConfigContext.Provider>
  );
}
