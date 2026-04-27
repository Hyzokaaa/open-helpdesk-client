import { useEffect, useState } from "react";
import { Link } from "react-router";
import Card from "@modules/app/modules/ui/components/Card/Card";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import { Workspace, listWorkspaces } from "../services/workspace.service";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function WorkspacesPage() {
  const { t, tEnum } = useTranslation();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listWorkspaces()
      .then(setWorkspaces)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;

  const roleColor = (role: string) => {
    if (role === "admin") return "primary" as const;
    if (role === "agent") return "blue" as const;
    return "gray" as const;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-body-bold text-heading">{t("workspaces.title")}</h2>
        <Link
          to="/dashboard/workspaces/new"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-button text-xs font-body-semibold text-white bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
        >
          {t("workspaces.new")}
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted mb-4">{t("workspaces.emptyHome")}</p>
          <Link
            to="/dashboard/workspaces/new"
            className="inline-flex items-center px-3 py-1.5 rounded-button text-xs font-body-semibold text-white bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
          >
            {t("workspaces.createFirst")}
          </Link>
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
