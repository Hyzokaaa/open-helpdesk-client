import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageLoader from "@modules/shared/components/PageLoader/PageLoader";
import { resolveOwnPortalLink } from "../services/portal.service";

/**
 * Where an emailed portal link leads once its owner signed in, while the portal is closed: their
 * ticket in the dashboard. Someone else's link, or a dead one, leads to their tickets instead.
 */
export default function PortalLinkRedirectPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    resolveOwnPortalLink(token)
      .then(({ workspaceSlug, ticketId }) => navigate(`/dashboard/workspaces/${workspaceSlug}/tickets/${ticketId}`, { replace: true }))
      .catch(() => navigate("/dashboard", { replace: true }));
  }, [token, navigate]);

  return <PageLoader />;
}
