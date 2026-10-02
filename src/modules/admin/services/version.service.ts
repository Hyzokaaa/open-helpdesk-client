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
  /** Product version this installation runs, or null when its components match no release. */
  currentProduct: string | null;
  latestRelease: LatestRelease | null;
  latestComponents: {
    backend: string | null;
    client: string | null;
  };
}

export async function getVersionInfo(clientVersion: string): Promise<VersionInfo> {
  const res = await http.get<VersionInfo>("/admin/version", { params: { client: clientVersion } });
  return res.data;
}
