import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import { Workspace, listWorkspaces } from "../services/workspace.service";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function WorkspacesPage() {
  const { t, tEnum } = useTranslation();
  const navigate = useNavigate();
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
        {workspaces.length > 0 && (
          <Button size="sm" onClick={() => navigate("/dashboard/workspaces/new")}>
            {t("workspaces.new")}
          </Button>
        )}
      </div>

      {workspaces.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted mb-4">{t("workspaces.emptyHome")}</p>
          <Button size="sm" onClick={() => navigate("/dashboard/workspaces/new")}>
            {t("workspaces.createFirst")}
          </Button>
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
