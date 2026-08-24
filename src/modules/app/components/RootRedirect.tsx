import { Navigate } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";
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

  // No custom domain → login
  return <Navigate to="/login" replace />;
}
