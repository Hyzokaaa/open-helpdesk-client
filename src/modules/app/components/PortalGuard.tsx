import { Navigate, Outlet, useLocation, useParams } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";
import PageLoader from "@modules/shared/components/PageLoader/PageLoader";
import usePortalSlug, { usePortalBasePath } from "@modules/portal/hooks/usePortalSlug";
import usePortalAccess from "@modules/portal/hooks/usePortalAccess";
import { portalSignInPath } from "@modules/portal/domain/portal-access";

export default function PortalGuard() {
  const { workspaceSlug } = useParams();
  const { domainWorkspaces } = useConfig();
  const slug = usePortalSlug();
  const basePath = usePortalBasePath();
  const { pathname } = useLocation();
  const access = usePortalAccess(slug);

  // Custom domain with slug — only allow if workspace belongs to this domain
  if (domainWorkspaces && workspaceSlug && !domainWorkspaces.some((w) => w.slug === workspaceSlug)) {
    return <Navigate to="/" replace />;
  }

  // No workspace to ask about: the page itself says so
  if (!slug) return <Outlet />;
  if (!access) return <PageLoader />;

  // The knowledge base has its own switch: a private one leads to the portal, or to sign-in if
  // the portal is closed too; the portal itself, when closed, leads to sign-in
  const isKb = pathname === `${basePath}/kb` || pathname.startsWith(`${basePath}/kb/`);
  if (isKb ? access.publicKbEnabled : access.portalEnabled) return <Outlet />;
  if (isKb && access.portalEnabled) return <Navigate to={basePath} replace />;
  return <Navigate to={portalSignInPath({ workspaceSlug: slug })} replace />;
}
