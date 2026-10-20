import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageLoader from "@modules/shared/components/PageLoader/PageLoader";
import { listWorkspaces } from "@modules/workspace/services/workspace.service";

/**
 * Where a closed portal leads once signed in: the workspace's tickets for whoever can see it, the
 * dashboard for anyone else (signed in for another workspace on the same domain, say).
 */
export default function PortalHomeRedirectPage() {
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!workspaceSlug) return;
    listWorkspaces()
      .then((workspaces) => navigate(
        workspaces.some((w) => w.slug === workspaceSlug) ? `/dashboard/workspaces/${workspaceSlug}/tickets` : "/dashboard",
        { replace: true },
      ))
      .catch(() => navigate("/dashboard", { replace: true }));
  }, [workspaceSlug, navigate]);

  return <PageLoader />;
}
