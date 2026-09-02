import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ConfigContext, type DomainWorkspace } from "./config-context";
import { getPublicConfig, resolveDomain, type PublicConfig } from "../services/config.service";
import { APP_NAME, APP_SUBTITLE } from "../domain/constants/env";

function applyNameSplit(fullName: string): { name: string; subtitle: string } {
  const endsWithHelpdesk = fullName.toLowerCase().endsWith("helpdesk");
  return {
    name: endsWithHelpdesk ? fullName.replace(/\s*[Hh]elpdesk$/, "") : fullName,
    subtitle: endsWithHelpdesk ? "Helpdesk" : "",
  };
}

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
  const [upgradeNotificationsEnabled, setUpgradeNotificationsEnabled] = useState(true);
  const [systemBranding, setSystemBranding] = useState<{ appName: string | null; appSubtitle: string | null; logo: string | null; icon: string | null }>({ appName: null, appSubtitle: null, logo: null, icon: null });

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
      setUpgradeNotificationsEnabled(config.upgradeNotificationsEnabled ?? true);
      setSystemBranding({
        appName: config.brandingAppName ?? null,
        appSubtitle: config.brandingAppSubtitle ?? null,
        logo: config.brandingLogo ?? null,
        icon: config.brandingIcon ?? null,
      });

      const resolved = await resolveDomain(window.location.hostname);
      if (resolved) setDomainWorkspaces(resolved);
    };
    init().finally(() => setLoading(false));
  }, []);

  const { brandName, brandSubtitle, brandLogo, brandIcon } = useMemo(() => {
    // System branding (from DB) with env var fallback
    const sysName = systemBranding.appName ?? null;
    const sysSplit = sysName ? applyNameSplit(sysName) : null;
    const systemName = sysSplit?.name ?? APP_NAME;
    const systemSubtitle = systemBranding.appSubtitle ?? sysSplit?.subtitle ?? APP_SUBTITLE;
    const systemLogo = systemBranding.logo ?? null;
    const systemIcon = systemBranding.icon ?? null;

    // Determine if workspace branding should apply
    // SaaS: only via custom domain. Selfhosted: always.
    const shouldApplyWorkspace = !saasMode || !!domainWorkspaces;
    const wsSource = shouldApplyWorkspace
      ? domainWorkspaces?.find((ws) => ws.appName || ws.appSubtitle || ws.logo || ws.icon) ?? null
      : null;

    if (!wsSource) {
      return { brandName: systemName, brandSubtitle: systemSubtitle, brandLogo: systemLogo, brandIcon: systemIcon };
    }

    // Workspace branding with field-by-field inheritance from system
    const wsAppName = wsSource.appName;
    const wsSplit = wsAppName ? applyNameSplit(wsAppName) : null;

    const name = wsSplit?.name ?? systemName;
    const subtitle = wsSource.appSubtitle ?? wsSplit?.subtitle ?? systemSubtitle;
    const logo = wsSource.logo ?? systemLogo;
    const icon = wsSource.icon ?? systemIcon;

    return { brandName: name, brandSubtitle: subtitle, brandLogo: logo, brandIcon: icon };
  }, [domainWorkspaces, systemBranding, saasMode]);

  useEffect(() => {
    document.title = brandSubtitle ? `${brandName} ${brandSubtitle}` : brandName;
  }, [brandName, brandSubtitle]);

  useEffect(() => {
    if (!brandIcon) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = brandIcon;
  }, [brandIcon]);

  return (
    <ConfigContext.Provider value={{ saasMode, paymentGateways, defaultGateway, paddleClientToken, paddleEnvironment, aiEnabled, emailConfigured, systemEmailFrom, upgradeNotificationsEnabled, loading, domainWorkspaces, brandName, brandSubtitle, brandLogo, brandIcon }}>
      {children}
    </ConfigContext.Provider>
  );
}
