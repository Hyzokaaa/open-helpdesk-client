import { useState } from "react";
import { toast } from "react-toastify";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Select from "@modules/app/modules/ui/components/Select/Select";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import useUser from "../hooks/useUser";
import useTheme from "@modules/app/hooks/useTheme";
import { Theme } from "@modules/app/context/theme-context";
import { updateLanguage, updateTheme } from "../services/auth.service";
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

export default function PreferencesSection() {
  const { user, setUser } = useUser();
  const { setTheme } = useTheme();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleLanguageChange = async (lang: { code: string; label: string }) => {
    setSaving(true);
    try {
      await updateLanguage(lang.code);
      setUser({ ...user, language: lang.code });
      LocalStorage.set(LOCAL_STORAGE_KEY.LANGUAGE, lang.code);
      toast.success(
        lang.code === "es" ? "Idioma actualizado" : "Language updated",
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

  return (
    <div className="w-full max-w-lg">
    <Card className="p-5">
      <p className="text-sm font-body-semibold text-heading mb-4">
        {t("settings.preferences")}
      </p>

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
    </Card>
    </div>
  );
}
