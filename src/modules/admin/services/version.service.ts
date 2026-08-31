import { http } from "@modules/app/modules/http/domain/http";

interface LatestRelease {
  product: string;
  components: {
    backend: string | null;
    client: string | null;
  };
  url: string;
  date: string;
}

export interface VersionInfo {
  backend: string;
  latestRelease: LatestRelease | null;
  latestComponents: {
    backend: string | null;
    client: string | null;
  };
}

export async function getVersionInfo(): Promise<VersionInfo> {
  const res = await http.get<VersionInfo>("/admin/version");
  return res.data;
}
