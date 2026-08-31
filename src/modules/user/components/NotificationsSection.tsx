import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import clsx from "clsx";
import Card from "@modules/app/modules/ui/components/Card/Card";
import {
  getPreferences,
  updatePreferences,
} from "@modules/notification/services/notification.service";
import { NotificationPreferences } from "@modules/notification/domain/notification";
import useTranslation from "@modules/app/i18n/useTranslation";
import useUser from "@modules/user/hooks/useUser";
import { ConfigContext } from "@modules/app/context/config-context";

const EVENT_KEYS = [
  { key: "TicketCreated", labelKey: "notifications.ticketCreated" },
  { key: "TicketAssigned", labelKey: "notifications.ticketAssigned" },
  { key: "StatusChanged", labelKey: "notifications.statusChanged" },
  { key: "CommentCreated", labelKey: "notifications.commentCreated" },
  { key: "TransferRequest", labelKey: "notifications.transferRequest" },
] as const;

const EMAIL_ONLY_KEYS = [
  { key: "emailCsatSurvey", labelKey: "notifications.csatSurvey" },
] as const;

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
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

export default function NotificationsSection() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { upgradeNotificationsEnabled } = useContext(ConfigContext);
  const showUpgrade = !!user?.isSystemAdmin && upgradeNotificationsEnabled;
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    getPreferences().then(setPrefs);
  }, []);

  if (!prefs) return null;

  const handleChange = async (key: string, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    try {
      await updatePreferences({ [key]: value });
    } catch {
      setPrefs(prefs);
      toast.error("Failed to update preferences");
    }
  };

  return (
    <div className="w-full max-w-lg">
    <Card className="p-5">
      <p className="text-sm font-body-semibold text-heading mb-5">
        {t("notifications.preferences")}
      </p>

      {/* Channels */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          onClick={() => handleChange("emailEnabled", !prefs.emailEnabled)}
          className={clsx(
            "rounded-lg border p-3 text-left transition-colors cursor-pointer",
            prefs.emailEnabled
              ? "border-primary bg-primary/5"
              : "border-border-card hover:border-border-input",
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-body-medium text-heading">
              {t("notifications.emailEnabled")}
            </span>
            <Toggle
              checked={prefs.emailEnabled}
              onChange={(v) => handleChange("emailEnabled", v)}
            />
          </div>
          <p className="text-exs text-muted leading-snug">
            {t("notifications.emailDesc")}
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleChange("inAppEnabled", !prefs.inAppEnabled)}
          className={clsx(
            "rounded-lg border p-3 text-left transition-colors cursor-pointer",
            prefs.inAppEnabled
              ? "border-primary bg-primary/5"
              : "border-border-card hover:border-border-input",
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-body-medium text-heading">
              {t("notifications.inAppEnabled")}
            </span>
            <Toggle
              checked={prefs.inAppEnabled}
              onChange={(v) => handleChange("inAppEnabled", v)}
            />
          </div>
          <p className="text-exs text-muted leading-snug">
            {t("notifications.inAppDesc")}
          </p>
        </button>
      </div>

      {prefs.inAppEnabled && (
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs text-body">
            {t("notifications.bellUnreadOnly")}
          </span>
          <Toggle
            checked={prefs.bellUnreadOnly}
            onChange={(v) => handleChange("bellUnreadOnly", v)}
          />
        </div>
      )}

      {/* Event matrix */}
      {(prefs.emailEnabled || prefs.inAppEnabled) && (
        <div>
          <p className="text-xs text-subtle font-body-medium mb-3">
            {t("notifications.events")}
          </p>

          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="flex-1" />
            {prefs.emailEnabled && (
              <span className="w-14 text-center text-exs text-subtle font-body-medium">
                {t("notifications.emailEnabled")}
              </span>
            )}
            {prefs.inAppEnabled && (
              <span className="w-14 text-center text-exs text-subtle font-body-medium">
                {t("notifications.inAppEnabled")}
              </span>
            )}
          </div>

          <div className="rounded-lg border border-border-card divide-y divide-border-card">
            {EVENT_KEYS.map(({ key, labelKey }) => (
              <div key={key} className="flex items-center gap-2 px-3 py-2.5">
                <span className="flex-1 text-xs text-body">{t(labelKey)}</span>
                {prefs.emailEnabled && (
                  <div className="w-14 flex justify-center">
                    <Toggle
                      checked={prefs[`email${key}` as keyof NotificationPreferences] as boolean}
                      onChange={(v) => handleChange(`email${key}`, v)}
                    />
                  </div>
                )}
                {prefs.inAppEnabled && (
                  <div className="w-14 flex justify-center">
                    <Toggle
                      checked={prefs[`inApp${key}` as keyof NotificationPreferences] as boolean}
                      onChange={(v) => handleChange(`inApp${key}`, v)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {showUpgrade && (
            <>
              <p className="text-xs text-subtle font-body-medium mb-2 mt-4">
                {t("notifications.system")}
              </p>
              <div className="rounded-lg border border-border-card divide-y divide-border-card">
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className="flex-1 text-xs text-body">{t("notifications.upgradeAvailable")}</span>
                  {prefs.emailEnabled && (
                    <div className="w-14 flex justify-center">
                      <Toggle
                        checked={prefs.emailUpgradeAvailable}
                        onChange={(v) => handleChange("emailUpgradeAvailable", v)}
                      />
                    </div>
                  )}
                  {prefs.inAppEnabled && (
                    <div className="w-14 flex justify-center">
                      <Toggle
                        checked={prefs.inAppUpgradeAvailable}
                        onChange={(v) => handleChange("inAppUpgradeAvailable", v)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {prefs.emailEnabled && EMAIL_ONLY_KEYS.length > 0 && (
            <>
              <p className="text-xs text-subtle font-body-medium mb-2 mt-4">
                {t("notifications.emailOnly")}
              </p>
              <div className="rounded-lg border border-border-card divide-y divide-border-card">
                {EMAIL_ONLY_KEYS.map(({ key, labelKey }) => (
                  <div key={key} className="flex items-center gap-2 px-3 py-2.5">
                    <span className="flex-1 text-xs text-body">{t(labelKey)}</span>
                    <div className="w-14 flex justify-center">
                      <Toggle
                        checked={prefs[key as keyof NotificationPreferences] as boolean}
                        onChange={(v) => handleChange(key, v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
    </div>
  );
}
