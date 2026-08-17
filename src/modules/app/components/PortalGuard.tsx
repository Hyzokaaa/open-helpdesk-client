import { Navigate, Outlet, useParams } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";

export default function PortalGuard() {
  const { workspaceSlug } = useParams();
  const { domainWorkspaces } = useConfig();

  // No custom domain restriction — allow all
  if (!domainWorkspaces) return <Outlet />;

  // Custom domain without slug (clean URL) — allow
  if (!workspaceSlug) return <Outlet />;

  // Custom domain with slug — only allow if workspace belongs to this domain
  const allowed = domainWorkspaces.some((w) => w.slug === workspaceSlug);
  if (!allowed) return <Navigate to="/" replace />;

  return <Outlet />;
}
