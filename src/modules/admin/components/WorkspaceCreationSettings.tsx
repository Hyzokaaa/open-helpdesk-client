import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Toggle from "@modules/app/modules/ui/components/Toggle/Toggle";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  type WorkspaceCreationSettings as Settings,
  getWorkspaceCreationSettings,
  updateWorkspaceCreationSettings,
} from "../services/workspace-creation-settings.service";

export default function WorkspaceCreationSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWorkspaceCreationSettings().then(setSettings).catch(() => toast.error(t("adminSettings.workspaceCreationLoadError")));
  }, []);

  if (!settings) return null;

  const change = async (value: "left" | "right") => {
    const selfService = value === "right";
    if (saving || settings.lockedByEnvironment || selfService === settings.selfService) return;
    setSaving(true);
    try {
      setSettings(await updateWorkspaceCreationSettings(selfService));
      toast.success(t("adminSettings.workspaceCreationSaved"));
    } catch {
      toast.error(t("adminSettings.workspaceCreationSaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-xs text-muted mb-3">{t("adminSettings.workspaceCreationDesc")}</p>
      <div className={settings.lockedByEnvironment ? "pointer-events-none opacity-60" : ""}>
        <Toggle
          left={t("adminSettings.workspaceCreationAdminsOnly")}
          right={t("adminSettings.workspaceCreationAnyone")}
          active={settings.selfService ? "right" : "left"}
          onChange={change}
        />
      </div>
      {settings.lockedByEnvironment && (
        <p className="text-exs text-muted mt-2">{t("adminSettings.workspaceCreationLocked")}</p>
      )}
      {settings.selfService && !settings.lockedByEnvironment && (
        <p className="text-exs text-amber-700 dark:text-amber-300 mt-2">{t("adminSettings.workspaceCreationAnyoneHint")}</p>
      )}
    </div>
  );
}
