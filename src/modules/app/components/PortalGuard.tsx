import { Navigate, Outlet, useLocation, useParams } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";
import PageLoader from "@modules/shared/components/PageLoader/PageLoader";
import usePortalSlug, { usePortalBasePath } from "@modules/portal/hooks/usePortalSlug";
import usePortalAccess from "@modules/portal/hooks/usePortalAccess";
import { portalEntry } from "@modules/app/domain/core/entry";

export default function PortalGuard() {
  const { workspaceSlug } = useParams();
  const { domainWorkspaces } = useConfig();
  const slug = usePortalSlug();
  const basePath = usePortalBasePath();
  const { pathname } = useLocation();
  const access = usePortalAccess(slug);

  const entry = portalEntry({ domainWorkspaces, routeSlug: workspaceSlug, slug, basePath, pathname, access });
  if (entry.kind === "loading") return <PageLoader />;
  if (entry.kind === "navigate") return <Navigate to={entry.to} replace />;
  return <Outlet />;
}
