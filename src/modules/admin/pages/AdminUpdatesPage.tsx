import { useEffect, useId, useState } from "react";
import { toast } from "react-toastify";
import Switch from "@modules/app/modules/ui/components/Switch/Switch";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";
import SystemVersionInfo from "../components/SystemVersionInfo";
import ChangelogNews from "../components/ChangelogNews";
import { upgradeChannels, withUpgradeChannel, type UpgradeChannel } from "../domain/upgrade-notify";
import {
  getNotificationSettings,
  updateNotificationSettings,
  type SystemNotificationSettings,
} from "../services/notification-settings.service";

export default function AdminUpdatesPage() {
  const { t } = useTranslation();
  const { UpdatesHeader } = useExtensions();
  const [settings, setSettings] = useState<SystemNotificationSettings | null>(null);
  const id = useId();

  useEffect(() => {
    getNotificationSettings().then(setSettings).catch(() => {});
  }, []);

  const handleChange = async (channel: UpgradeChannel, on: boolean) => {
    if (!settings) return;
    const updated = withUpgradeChannel(settings, channel, on);
    setSettings(updated);
    try {
      await updateNotificationSettings(updated);
    } catch {
      setSettings(settings);
      toast.error(t("common.saveError"));
    }
  };

  const channels = settings ? upgradeChannels(settings) : null;

  return (
    <div className="w-full max-w-3xl">
      <h2 className="text-lg font-body-bold text-heading mb-6">
        {t("sidebar.adminUpdates")}
      </h2>

      {UpdatesHeader && <UpdatesHeader />}

      <SystemVersionInfo basedOn={!!UpdatesHeader} />

      {channels && (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-border-card bg-surface px-4 py-3">
          <p className="mr-auto text-sm font-body-semibold text-heading">{t("admin.upgradeNotify")}</p>
          {/* The two switches wrap together, never one alone */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={channels.email} onChange={(v) => handleChange("email", v)} labelledBy={`${id}-email`} />
              <span id={`${id}-email`} className="text-sm text-body">{t("admin.upgradeByEmail")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={channels.inApp} onChange={(v) => handleChange("inApp", v)} labelledBy={`${id}-in-app`} />
              <span id={`${id}-in-app`} className="text-sm text-body">{t("admin.upgradeInTheApp")}</span>
            </div>
          </div>
        </div>
      )}

      <ChangelogNews />
    </div>
  );
}
