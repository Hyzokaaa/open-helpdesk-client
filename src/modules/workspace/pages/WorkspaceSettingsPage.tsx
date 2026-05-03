import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Textarea from "@modules/app/modules/ui/components/Textarea/Textarea";
import Button from "@modules/app/modules/ui/components/Button/Button";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import useUser from "@modules/user/hooks/useUser";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import {
  WorkspaceDetail,
  getWorkspace,
  updateWorkspace,
  updateWorkspacePalette,
  deleteWorkspace,
  listMembers,
  WorkspaceMember,
} from "../services/workspace.service";
import { PaletteContext } from "../context/PaletteProvider";
import PalettePicker from "../components/PalettePicker";
import useTranslation from "@modules/app/i18n/useTranslation";
import { P } from "../domain/permissions";

interface Props {
  workspaceSlugProp?: string;
  onClose?: () => void;
}

export default function WorkspaceSettingsPage({ workspaceSlugProp, onClose }: Props = {}) {
  const params = useParams();
  const workspaceSlug = workspaceSlugProp || params.workspaceSlug;
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useTranslation();
  const { can } = usePermissions(workspaceSlug);
  const { setPalette } = useContext(PaletteContext);

  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceSlug) return;
    Promise.all([getWorkspace(workspaceSlug), listMembers(workspaceSlug)])
      .then(([ws, m]) => {
        setWorkspace(ws);
        setName(ws.name);
        setDescription(ws.description);
        setMembers(m);
      })
      .finally(() => setLoading(false));
  }, [workspaceSlug]);

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;
  if (!workspace) return null;

  const isSystemAdmin = user?.isSystemAdmin ?? false;
  const canManageSettings = can(P.WORKSPACE_SETTINGS_MANAGE);
  const hasChanges = name !== workspace.name || description !== workspace.description;
  const nameValid = name.trim().length > 0;

  const handlePaletteChange = async (palette: string) => {
    if (!workspaceSlug) return;
    try {
      await updateWorkspacePalette(workspaceSlug, palette === "green" ? null : palette);
      setPalette(palette);
      setWorkspace({ ...workspace, palette: palette === "green" ? null : palette });
      toast.success(t("workspaceSettings.updated"));
    } catch (err: any) {
      if (!err?.handled) toast.error(t("workspaceSettings.updateError"));
    }
  };

  const handleSave = async () => {
    if (!workspaceSlug || !nameValid) return;
    setSaving(true);
    try {
      await updateWorkspace(workspaceSlug, { name: name.trim(), description: description.trim() });
      toast.success(t("workspaceSettings.updated"));
      const updated = await getWorkspace(workspaceSlug);
      setWorkspace(updated);
    } catch {
      toast.error(t("workspaceSettings.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceSlug) return;
    try {
      await deleteWorkspace(workspaceSlug);
      toast.success(t("workspaceSettings.deleted"));
      if (onClose) onClose();
      else navigate("/dashboard/settings/account");
    } catch {
      toast.error(t("workspaceSettings.deleteError"));
    } finally {
      setConfirmDelete(false);
    }
  };

  const adminCount = members.filter((m) => m.role === "admin").length;
  const agentCount = members.filter((m) => m.role === "agent").length;
  const reporterCount = members.filter((m) => m.role === "reporter").length;

  return (
    <div className="w-full max-w-3xl">
      {confirmDelete && (
        <ConfirmModal
          title={t("workspaceSettings.deleteTitle")}
          message={t("workspaceSettings.deleteMessage")}
          confirmLabel={t("workspaceSettings.deleteConfirm")}
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-body-bold text-heading">{workspace.name}</h2>
        <div className="flex items-center gap-2 mt-2">
          <StatusBadge label={workspace.slug} color="primary" size="xs" />
          <span className="text-xs text-muted">{members.length} {t("sidebar.members").toLowerCase()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {isSystemAdmin ? (
            <Card className="p-5">
              <p className="text-xs font-body-medium text-subtle uppercase mb-3">
                {t("workspaceSettings.general")}
              </p>
              <div className="space-y-3">
                <FormInput label={t("workspaces.name")}>
                  <Input value={name} onChange={setName} size="sm" />
                </FormInput>
                <FormInput label={t("workspaces.description")}>
                  <Textarea value={description} onChange={setDescription} height={80} />
                </FormInput>
              </div>
              {hasChanges && (
                <div className="mt-4">
                  <Button size="xs" color="primary" onClick={handleSave} disabled={!nameValid} loading={saving}>
                    {t("settings.save")}
                  </Button>
                </div>
              )}
            </Card>
          ) : !canManageSettings ? (
            <p className="text-sm text-muted text-center py-12">
              {t("workspaceSettings.noPermission")}
            </p>
          ) : null}

          {canManageSettings && (
            <Card className="p-5">
              <p className="text-xs font-body-medium text-subtle uppercase mb-3">
                {t("workspaceSettings.palette")}
              </p>
              <PalettePicker value={workspace.palette} onChange={handlePaletteChange} />
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-xs text-subtle font-body-medium mb-2">
              {t("sidebar.members")}
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Admins</span>
                <span className="text-body font-body-medium">{adminCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Agents</span>
                <span className="text-body font-body-medium">{agentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Reporters</span>
                <span className="text-body font-body-medium">{reporterCount}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-xs text-subtle font-body-medium mb-2">
              {t("workspaceSettings.info")}
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Slug</span>
                <span className="text-body font-body-medium">{workspace.slug}</span>
              </div>
            </div>
          </Card>

          {isSystemAdmin && (
            <Card className="p-4 border-red-300 dark:border-red-900/50">
              <p className="text-xs font-body-semibold text-red-600 mb-1">
                {t("workspaceSettings.dangerZone")}
              </p>
              <p className="text-exs text-muted mb-3">
                {t("workspaceSettings.dangerDescription")}
              </p>
              <Button size="xs" color="danger" full onClick={() => setConfirmDelete(true)}>
                {t("workspaceSettings.deleteWorkspace")}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
