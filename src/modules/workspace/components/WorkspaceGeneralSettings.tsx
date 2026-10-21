import { ReactNode, useState } from "react";
import { toast } from "react-toastify";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Textarea from "@modules/app/modules/ui/components/Textarea/Textarea";
import Button from "@modules/app/modules/ui/components/Button/Button";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import useTranslation from "@modules/app/i18n/useTranslation";
import useUnsavedChanges from "@modules/app/hooks/useUnsavedChanges";
import { WorkspaceDetail, WorkspaceMember, getWorkspace, updateWorkspace } from "../services/workspace.service";

interface Props {
  workspace: WorkspaceDetail;
  members: WorkspaceMember[];
  /** Only a system admin renames the workspace; everyone else who opens settings reads it. */
  canEdit: boolean;
  onUpdated: (workspace: WorkspaceDetail) => void;
  /** Where to manage who is in it; absent for whoever may not see the members. */
  membersLink?: ReactNode;
}

/** The workspace's name and description, its address and who is in it. */
export default function WorkspaceGeneralSettings({ workspace, members, canEdit, onUpdated, membersLink }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description);
  const [saving, setSaving] = useState(false);

  const hasChanges = name !== workspace.name || description !== workspace.description;
  const nameValid = name.trim().length > 0;
  useUnsavedChanges(canEdit && hasChanges);

  const handleSave = async () => {
    if (!nameValid) return;
    setSaving(true);
    try {
      await updateWorkspace(workspace.slug, { name: name.trim(), description: description.trim() });
      toast.success(t("workspaceSettings.updated"));
      const updated = await getWorkspace(workspace.slug);
      setName(updated.name);
      setDescription(updated.description);
      onUpdated(updated);
    } catch {
      toast.error(t("workspaceSettings.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const counts = [
    { label: t("workspaceSettings.admins"), value: members.filter((m) => m.role === "admin").length },
    { label: t("workspaceSettings.agents"), value: members.filter((m) => m.role === "agent").length },
    { label: t("workspaceSettings.users"), value: members.filter((m) => m.role === "user").length },
  ];

  return (
    <div className="space-y-5">
      {canEdit ? (
        <div className="space-y-3">
          <FormInput label={t("workspaces.name")} required>
            <Input value={name} onChange={setName} size="sm" />
          </FormInput>
          <FormInput label={t("workspaces.description")}>
            <Textarea value={description} onChange={setDescription} height={80} />
          </FormInput>
          <div className="flex justify-end gap-2">
            <Button size="xs" color="light" disabled={!hasChanges || saving} onClick={() => { setName(workspace.name); setDescription(workspace.description); }}>
              {t("discard.confirm")}
            </Button>
            <Button size="xs" color="primary" onClick={handleSave} disabled={!hasChanges || !nameValid} loading={saving}>
              {t("settings.save")}
            </Button>
          </div>
        </div>
      ) : (
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted">{t("workspaces.name")}</dt>
            <dd className="text-body font-body-medium">{workspace.name}</dd>
          </div>
          {workspace.description && (
            <div>
              <dt className="text-xs text-muted">{t("workspaces.description")}</dt>
              <dd className="text-body whitespace-pre-line">{workspace.description}</dd>
            </div>
          )}
          <p className="text-xs text-muted">{t("settingsNav.generalReadOnly")}</p>
        </dl>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border-card pt-4">
        <div>
          <p className="text-xs text-muted mb-1">{t("workspaceSettings.slug")}</p>
          <p className="text-sm text-body font-body-medium font-mono">{workspace.slug}</p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">{t("sidebar.members")}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {counts.map((c) => (
              <li key={c.label}><span className="text-body font-body-semibold">{c.value}</span> <span className="text-muted">{c.label}</span></li>
            ))}
          </ul>
          {membersLink && <p className="text-xs mt-1.5">{membersLink}</p>}
        </div>
      </div>
    </div>
  );
}
