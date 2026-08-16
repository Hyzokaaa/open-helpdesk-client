import { http } from "@modules/app/modules/http/domain/http";

export interface PublicConfig {
  saasMode: boolean;
  paymentGateways: string[];
  defaultGateway: string;
  paddleClientToken: string | null;
  paddleEnvironment: string;
  aiEnabled: boolean;
  emailConfigured: boolean;
  systemEmailFrom: string | null;
}

export async function getPublicConfig(): Promise<PublicConfig> {
  try {
    const res = await http.get<PublicConfig>("/config/public");
    return res.data;
  } catch {
    return { saasMode: false, paymentGateways: [], defaultGateway: "", paddleClientToken: null, paddleEnvironment: "sandbox", aiEnabled: false, emailConfigured: false, systemEmailFrom: null };
  }
}

export interface ResolvedWorkspace {
  slug: string;
  name: string;
  palette: string | null;
}

export async function resolveDomain(host: string): Promise<ResolvedWorkspace[] | null> {
  try {
    const res = await http.get<{ workspaces: ResolvedWorkspace[] }>(`/internal/resolve-domain?host=${encodeURIComponent(host)}`);
    return res.data.workspaces.length > 0 ? res.data.workspaces : null;
  } catch {
    return null;
  }
}
