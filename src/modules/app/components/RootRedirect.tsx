import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";
import PageLoader from "@modules/shared/components/PageLoader/PageLoader";
import PortalSelector from "@modules/portal/components/PortalSelector";
import { http } from "@modules/app/modules/http/domain/http";

export default function RootRedirect() {
  const { domainWorkspaces } = useConfig();
  const [defaultSlug, setDefaultSlug] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (domainWorkspaces) return;
    http.get<{ slug: string }>("/internal/default-workspace")
      .then((res) => setDefaultSlug(res.data.slug))
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [domainWorkspaces]);

  // Custom domain with 1 workspace → portal directly (clean URL)
  if (domainWorkspaces?.length === 1) {
    return <Navigate to="/portal" replace />;
  }

  // Custom domain with N workspaces → public portal selector
  if (domainWorkspaces && domainWorkspaces.length > 1) {
    return <PortalSelector workspaces={domainWorkspaces} />;
  }

  // No custom domain — waiting for default-workspace check
  if (!checked) return <PageLoader />;

  // Single workspace → portal
  if (defaultSlug) return <Navigate to={`/portal/${defaultSlug}`} replace />;

  // Multiple workspaces, no custom domain → login as usual
  return <Navigate to="/login" replace />;
}
