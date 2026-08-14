import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";
import PageLoader from "@modules/shared/components/PageLoader/PageLoader";
import { http } from "@modules/app/modules/http/domain/http";

export default function RootRedirect() {
  const { domainWorkspaces } = useConfig();
  const [defaultSlug, setDefaultSlug] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // Custom domain with 1 workspace → portal directly
  if (domainWorkspaces?.length === 1) {
    return <Navigate to={`/portal/${domainWorkspaces[0].slug}`} replace />;
  }

  // Custom domain with N workspaces → login (they'll see filtered selector)
  if (domainWorkspaces && domainWorkspaces.length > 1) {
    return <Navigate to="/login" replace />;
  }

  // No custom domain — check if there's exactly 1 workspace (selfhosted typical case)
  useEffect(() => {
    http.get<{ slug: string }>("/internal/default-workspace")
      .then((res) => setDefaultSlug(res.data.slug))
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return <PageLoader />;

  // Single workspace → portal
  if (defaultSlug) return <Navigate to={`/portal/${defaultSlug}`} replace />;

  // Multiple workspaces, no custom domain → login as usual
  return <Navigate to="/login" replace />;
}
