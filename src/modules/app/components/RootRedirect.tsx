import { Navigate } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";
import { LOCAL_STORAGE_KEY, LocalStorage } from "@modules/app/domain/core/local-storage";
import { rootEntry } from "@modules/app/domain/core/entry";
import PortalSelector from "@modules/portal/components/PortalSelector";

export default function RootRedirect() {
  const { domainWorkspaces } = useConfig();
  const entry = rootEntry(domainWorkspaces, !!LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN));

  // Custom domain with several workspaces, some portal open: the public portal selector
  if (entry.kind === "portal-selector") return <PortalSelector workspaces={domainWorkspaces!} />;
  return <Navigate to={entry.to} replace />;
}
