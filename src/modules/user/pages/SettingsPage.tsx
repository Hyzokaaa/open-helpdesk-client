import { useState } from "react";
import { toast } from "react-toastify";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Select from "@modules/app/modules/ui/components/Select/Select";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import useUser from "../hooks/useUser";
import { updateLanguage } from "../services/auth.service";
import useTranslation from "@modules/app/i18n/useTranslation";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
] as const;

export default function SettingsPage() {
  const { user, setUser } = useUser();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleLanguageChange = async (lang: { code: string; label: string }) => {
    setSaving(true);
    try {
      await updateLanguage(lang.code);
      setUser({ ...user, language: lang.code });
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

  return (
    <div className="w-full max-w-lg">
      <h2 className="text-lg font-body-bold text-gray-800 mb-6">{t("settings.title")}</h2>

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

        <div className="border-t border-gray-100 pt-4 mt-2">
          <p className="text-xs text-gray-400 font-body-medium mb-2">{t("settings.account")}</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("settings.name")}</span>
              <span className="text-gray-700 font-body-medium">
                {user.firstName} {user.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("settings.email")}</span>
              <span className="text-gray-700 font-body-medium">{user.email}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
