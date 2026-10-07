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
      <Toggle
        left={t("adminSettings.workspaceCreationAdminsOnly")}
        right={t("adminSettings.workspaceCreationAnyone")}
        active={settings.selfService ? "right" : "left"}
        onChange={change}
        disabled={settings.lockedByEnvironment}
      />
      {settings.selfService && (
        <p className={settings.lockedByEnvironment ? "text-xs text-muted mt-2" : "text-xs text-amber-700 dark:text-amber-300 mt-2"}>
          {t("adminSettings.workspaceCreationAnyoneHint")}
        </p>
      )}
      {settings.lockedByEnvironment && (
        <p className="flex items-start gap-2 rounded-md bg-surface-hover px-3 py-2 text-xs text-body mt-3">
          <svg className="w-3.5 h-3.5 mt-px shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          {t("adminSettings.workspaceCreationLocked")}
        </p>
      )}
    </div>
  );
}
