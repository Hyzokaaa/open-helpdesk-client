import { Navigate } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";
import { LOCAL_STORAGE_KEY, LocalStorage } from "@modules/app/domain/core/local-storage";
import PortalSelector from "@modules/portal/components/PortalSelector";

export default function RootRedirect() {
  const { domainWorkspaces } = useConfig();

  // Custom domain with 1 workspace → portal directly (clean URL)
  if (domainWorkspaces?.length === 1) {
    return <Navigate to="/portal" replace />;
  }

  // Custom domain with N workspaces → public portal selector
  if (domainWorkspaces && domainWorkspaces.length > 1) {
    return <PortalSelector workspaces={domainWorkspaces} />;
  }

  // No custom domain: someone already signed in goes on to the dashboard, anyone else to sign in.
  // A session that turns out to be expired is sent back to sign in by the dashboard itself.
  const signedIn = !!LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
  return <Navigate to={signedIn ? "/dashboard" : "/login"} replace />;
}
