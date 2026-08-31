import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import clsx from "clsx";
import Card from "@modules/app/modules/ui/components/Card/Card";
import useTranslation from "@modules/app/i18n/useTranslation";
import SystemVersionInfo from "../components/SystemVersionInfo";
import {
  getNotificationSettings,
  updateNotificationSettings,
  type SystemNotificationSettings,
} from "../services/notification-settings.service";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={clsx(
        "w-8 h-[18px] rounded-full transition-colors cursor-pointer shrink-0 p-[2px] flex",
        checked ? "bg-primary justify-end" : "bg-subtle justify-start",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      <span className="block w-[14px] h-[14px] rounded-full bg-white shadow-sm" />
    </button>
  );
}

export default function AdminUpdatesPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SystemNotificationSettings | null>(null);

  useEffect(() => {
    getNotificationSettings().then(setSettings).catch(() => {});
  }, []);

  const handleChange = async (key: keyof SystemNotificationSettings, value: boolean) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await updateNotificationSettings({ [key]: value });
    } catch {
      setSettings(settings);
      toast.error(t("common.saveError"));
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <h2 className="text-lg font-body-bold text-heading mb-6">
        {t("sidebar.adminUpdates")}
      </h2>

      <SystemVersionInfo />

      {settings && (
        <Card className="p-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-body-semibold text-heading">
              {t("admin.upgradeNotifications")}
            </p>
            <Toggle
              checked={settings.upgradeEnabled}
              onChange={(v) => handleChange("upgradeEnabled", v)}
            />
          </div>

          {settings.upgradeEnabled && (
            <div className="rounded-lg border border-border-card divide-y divide-border-card">
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-body">{t("admin.upgradeEmail")}</span>
                <Toggle
                  checked={settings.upgradeEmail}
                  onChange={(v) => handleChange("upgradeEmail", v)}
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-body">{t("admin.upgradeInApp")}</span>
                <Toggle
                  checked={settings.upgradeInApp}
                  onChange={(v) => handleChange("upgradeInApp", v)}
                />
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
