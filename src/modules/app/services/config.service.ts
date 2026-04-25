import { http } from "@modules/app/modules/http/domain/http";

interface PublicConfig {
  saasMode: boolean;
}

export async function getPublicConfig(): Promise<PublicConfig> {
  try {
    const res = await http.get<PublicConfig>("/config/public");
    return res.data;
  } catch {
    return { saasMode: false };
  }
}
