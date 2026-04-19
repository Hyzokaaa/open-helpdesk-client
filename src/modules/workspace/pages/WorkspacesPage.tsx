import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import {
  Workspace,
  listWorkspaces,
  createWorkspace,
} from "../services/workspace.service";
import useUser from "@modules/user/hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function WorkspacesPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useTranslation();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchWorkspaces = () => {
    setLoading(true);
    listWorkspaces()
      .then(setWorkspaces)
      .catch(() => toast.error("Failed to load workspaces"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createWorkspace({ name, description });
      setName("");
      setDescription("");
      setShowCreate(false);
      fetchWorkspaces();
      toast.success(t("workspaces.created"));
    } catch {
      toast.error("Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-body-bold text-gray-800">{t("workspaces.title")}</h2>
        {user?.isSystemAdmin && (
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? t("workspaces.cancel") : t("workspaces.new")}
          </Button>
        )}
      </div>

      {showCreate && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreate}>
            <div className="flex gap-4">
              <FormInput label={t("workspaces.name")} required className="flex-1">
                <Input
                  placeholder={t("workspaces.namePlaceholder")}
                  value={name}
                  onChange={setName}
                />
              </FormInput>
              <FormInput label={t("workspaces.description")} className="flex-1">
                <Input
                  placeholder={t("workspaces.descriptionPlaceholder")}
                  value={description}
                  onChange={setDescription}
                />
              </FormInput>
            </div>
            <Button type="submit" size="sm" loading={creating}>
              {t("workspaces.create")}
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner width={24} />
        </div>
      ) : workspaces.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-12">
          {t("workspaces.empty")}
        </p>
      ) : (
        <div className="grid gap-3">
          {workspaces.map((ws) => (
            <Card
              key={ws.id}
              className="p-4 flex items-center justify-between"
              onClick={() => navigate(`/dashboard/workspaces/${ws.slug}/tickets`)}
            >
              <div>
                <p className="text-sm font-body-semibold text-gray-800">
                  {ws.name}
                </p>
                {ws.description && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {ws.description}
                  </p>
                )}
              </div>
              <StatusBadge label={ws.role} color="primary" size="xs" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
