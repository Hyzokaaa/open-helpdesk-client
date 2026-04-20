import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import clsx from "clsx";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Select from "@modules/app/modules/ui/components/Select/Select";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import useUser from "../hooks/useUser";
import useTheme from "@modules/app/hooks/useTheme";
import { Theme } from "@modules/app/context/theme-context";
import { updateLanguage, updateTheme } from "../services/auth.service";
import {
  getPreferences,
  updatePreferences,
} from "@modules/notification/services/notification.service";
import { NotificationPreferences } from "@modules/notification/domain/notification";
import { LOCAL_STORAGE_KEY, LocalStorage } from "@modules/app/domain/core/local-storage";
import useTranslation from "@modules/app/i18n/useTranslation";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
] as const;

const THEMES = [
  { code: "system", labelKey: "settings.themeSystem" },
  { code: "light", labelKey: "settings.themeLight" },
  { code: "light-border", labelKey: "settings.themeLightBorder" },
  { code: "dark", labelKey: "settings.themeDark" },
  { code: "dark-deep", labelKey: "settings.themeDarkDeep" },
] as const;

const EVENT_KEYS = [
  { key: "TicketCreated", labelKey: "notifications.ticketCreated" },
  { key: "TicketAssigned", labelKey: "notifications.ticketAssigned" },
  { key: "StatusChanged", labelKey: "notifications.statusChanged" },
  { key: "CommentCreated", labelKey: "notifications.commentCreated" },
] as const;

export default function SettingsPage() {
  const { user, setUser } = useUser();
  const { setTheme } = useTheme();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    getPreferences().then(setPrefs);
  }, []);

  if (!user) return null;

  const handleLanguageChange = async (lang: { code: string; label: string }) => {
    setSaving(true);
    try {
      await updateLanguage(lang.code);
      setUser({ ...user, language: lang.code });
      LocalStorage.set(LOCAL_STORAGE_KEY.LANGUAGE, lang.code);
      toast.success(
        lang.code === "es"
          ? "Idioma actualizado"
          : "Language updated",
      );
    } catch {
      toast.error("Failed to update language");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (option: { code: string; labelKey: string }) => {
    setSaving(true);
    try {
      await updateTheme(option.code);
      setUser({ ...user, theme: option.code });

      if (option.code === "system") {
        const resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        setTheme(resolved as Theme);
      } else {
        setTheme(option.code as Theme);
      }
    } catch {
      toast.error("Failed to update theme");
    } finally {
      setSaving(false);
    }
  };

  const handlePrefChange = async (key: string, value: boolean) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    try {
      await updatePreferences({ [key]: value });
    } catch {
      setPrefs(prefs);
      toast.error("Failed to update preferences");
    }
  };

  const Toggle = ({
    checked,
    onChange,
    disabled,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
  }) => (
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

  return (
    <div className="w-full max-w-lg">
      <h2 className="text-lg font-body-bold text-heading mb-6">{t("settings.title")}</h2>

      <Card className="p-5">
        <FormInput label={t("settings.language")}>
          <Select
            options={[...LANGUAGES]}
            label={(l) => l.label}
            value={(l) => l.code === user.language}
            onChange={handleLanguageChange}
            disabled={saving}
          />
        </FormInput>

        <FormInput label={t("settings.theme")}>
          <Select
            options={[...THEMES]}
            label={(o) => t(o.labelKey)}
            value={(o) => o.code === user.theme}
            onChange={handleThemeChange}
            disabled={saving}
          />
        </FormInput>

        <div className="border-t border-border-card pt-4 mt-2">
          <p className="text-xs text-subtle font-body-medium mb-2">{t("settings.account")}</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{t("settings.name")}</span>
              <span className="text-body font-body-medium">
                {user.firstName} {user.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t("settings.email")}</span>
              <span className="text-body font-body-medium">{user.email}</span>
            </div>
          </div>
        </div>
      </Card>

      {prefs && (
        <Card className="p-5 mt-4">
          <p className="text-sm font-body-semibold text-heading mb-5">
            {t("notifications.preferences")}
          </p>

          {/* Channels */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Email channel */}
            <button
              type="button"
              onClick={() => handlePrefChange("emailEnabled", !prefs.emailEnabled)}
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
                  onChange={(v) => handlePrefChange("emailEnabled", v)}
                />
              </div>
              <p className="text-exs text-muted leading-snug">
                {t("notifications.emailDesc")}
              </p>
            </button>

            {/* In-app channel */}
            <button
              type="button"
              onClick={() => handlePrefChange("inAppEnabled", !prefs.inAppEnabled)}
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
                  onChange={(v) => handlePrefChange("inAppEnabled", v)}
                />
              </div>
              <p className="text-exs text-muted leading-snug">
                {t("notifications.inAppDesc")}
              </p>
            </button>
          </div>

          {/* Event matrix */}
          {(prefs.emailEnabled || prefs.inAppEnabled) && (
            <div>
              <p className="text-xs text-subtle font-body-medium mb-3">
                {t("notifications.events")}
              </p>

              {/* Header */}
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

              {/* Rows */}
              <div className="rounded-lg border border-border-card divide-y divide-border-card">
                {EVENT_KEYS.map(({ key, labelKey }) => (
                  <div key={key} className="flex items-center gap-2 px-3 py-2.5">
                    <span className="flex-1 text-xs text-body">{t(labelKey)}</span>
                    {prefs.emailEnabled && (
                      <div className="w-14 flex justify-center">
                        <Toggle
                          checked={prefs[`email${key}` as keyof NotificationPreferences] as boolean}
                          onChange={(v) => handlePrefChange(`email${key}`, v)}
                        />
                      </div>
                    )}
                    {prefs.inAppEnabled && (
                      <div className="w-14 flex justify-center">
                        <Toggle
                          checked={prefs[`inApp${key}` as keyof NotificationPreferences] as boolean}
                          onChange={(v) => handlePrefChange(`inApp${key}`, v)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
