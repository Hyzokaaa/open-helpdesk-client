import { Navigate, Outlet, useParams } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";

export default function PortalGuard() {
  const { workspaceSlug } = useParams();
  const { domainWorkspaces } = useConfig();

  if (!domainWorkspaces || !workspaceSlug) return <Outlet />;

  const allowed = domainWorkspaces.some((w) => w.slug === workspaceSlug);
  if (!allowed) return <Navigate to="/" replace />;

  return <Outlet />;
}
