import { useEffect, useState } from "react";
import { Link } from "react-router";
import useTranslation from "@modules/app/i18n/useTranslation";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import { getWorkspace } from "@modules/workspace/services/workspace.service";
import { PortalStateBadge } from "@modules/workspace/components/PortalAccessSettings";

/** Whether what is published here is public, so whoever writes knows; changed in the settings */
export default function KbVisibilityLine({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const { can } = usePermissions(slug);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);

  useEffect(() => {
    getWorkspace(slug).then((ws) => setIsPublic(ws.publicKbEnabled ?? true)).catch(() => {});
  }, [slug]);

  if (isPublic === null) return null;
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs text-muted mb-6">
      <PortalStateBadge on={isPublic} onLabel={t("portalAccess.kbPublic")} offLabel={t("portalAccess.kbPrivate")} />
      <span>{t(isPublic ? "kb.visibilityPublic" : "kb.visibilityPrivate")}</span>
      {can(P.WORKSPACE_SETTINGS_MANAGE) && (
        <Link to={`/dashboard/workspaces/${slug}/settings`} className="text-primary hover:underline">{t("kb.visibilityChange")}</Link>
      )}
    </p>
  );
}
