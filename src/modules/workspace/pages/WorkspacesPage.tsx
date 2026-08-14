import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import { Workspace, listWorkspaces } from "../services/workspace.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import useUser from "@modules/user/hooks/useUser";
import { canCreateWorkspace } from "../domain/can-create-workspace";

export default function WorkspacesPage() {
  const { t, tEnum } = useTranslation();
  const navigate = useNavigate();
  const { domainWorkspaces, saasMode } = useConfig();
  const { user } = useUser();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const isCustomDomain = !!domainWorkspaces;
  const showCreate = canCreateWorkspace(saasMode, isCustomDomain, user?.isSystemAdmin ?? false);
  const lockedSlug = domainWorkspaces?.length === 1 ? domainWorkspaces[0].slug : null;

  useEffect(() => {
    if (lockedSlug) {
      navigate(`/dashboard/workspaces/${lockedSlug}/tickets`, { replace: true });
      return;
    }
    listWorkspaces()
      .then((ws) => {
        if (domainWorkspaces) {
          const slugs = domainWorkspaces.map((d) => d.slug);
          setWorkspaces(ws.filter((w) => slugs.includes(w.slug)));
        } else {
          setWorkspaces(ws);
        }
      })
      .finally(() => setLoading(false));
  }, [lockedSlug]);

  if (loading || lockedSlug) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;

  const roleColor = (role: string) => {
    if (role === "admin") return "primary" as const;
    if (role === "agent") return "blue" as const;
    return "gray" as const;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-body-bold text-heading">{t("workspaces.title")}</h2>
        {workspaces.length > 0 && showCreate && (
          <Button size="sm" onClick={() => navigate("/dashboard/workspaces/new")}>
            {t("workspaces.new")}
          </Button>
        )}
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-muted mb-4">{t("workspaces.emptyHome")}</p>
          {showCreate && (
            <Button size="sm" onClick={() => navigate("/dashboard/workspaces/new")}>
              {t("workspaces.createFirst")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Card
              key={ws.id}
              onClick={() => {}}
              className="p-5 hover:border-primary-300 hover:shadow-md"
            >
              <Link
                to={`/dashboard/workspaces/${ws.slug}/tickets`}
                className="block"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-body-bold text-heading truncate">{ws.name}</h3>
                  <StatusBadge label={tEnum("role", ws.role)} color={roleColor(ws.role)} size="xs" />
                </div>
                <p className="text-xs text-muted line-clamp-2 min-h-[2rem]">
                  {ws.description || t("workspaces.noDescription")}
                </p>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
