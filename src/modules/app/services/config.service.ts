import { http } from "@modules/app/modules/http/domain/http";

export interface PublicConfig {
  saasMode: boolean;
  paymentGateways: string[];
  defaultGateway: string;
  paddleClientToken: string | null;
  paddleEnvironment: string;
  aiEnabled: boolean;
  emailConfigured: boolean;
}

export async function getPublicConfig(): Promise<PublicConfig> {
  try {
    const res = await http.get<PublicConfig>("/config/public");
    return res.data;
  } catch {
    return { saasMode: false, paymentGateways: [], defaultGateway: "", paddleClientToken: null, paddleEnvironment: "sandbox", aiEnabled: false, emailConfigured: false };
  }
}
