import { Link } from "react-router";
import useTranslation from "@modules/app/i18n/useTranslation";
import usePortalSlug, { usePortalBasePath } from "../hooks/usePortalSlug";
import usePortalAccess from "../hooks/usePortalAccess";
import { portalSignInPath } from "../domain/portal-access";

/**
 * "Create a ticket" under the articles: the portal's form, or, with the portal closed, sign-in that
 * then opens the new-ticket form of the dashboard.
 */
export default function PortalKbCreateTicketLink() {
  const { t } = useTranslation();
  const slug = usePortalSlug();
  const basePath = usePortalBasePath();
  const access = usePortalAccess(slug);
  const className = "text-sm text-primary hover:underline";

  if (!access || access.portalEnabled || !slug) {
    return <Link to={basePath} className={className}>{t("portalKb.createTicket")}</Link>;
  }
  return (
    <Link to={portalSignInPath({ workspaceSlug: slug, redirect: `/dashboard/workspaces/${slug}/tickets/new` })} className={className}>
      {t("portalKb.signInToCreateTicket")}
    </Link>
  );
}
