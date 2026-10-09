import { useState } from "react";
import { toast } from "react-toastify";
import Select from "@modules/app/modules/ui/components/Select/Select";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import useTranslation from "@modules/app/i18n/useTranslation";
import { updateWorkspaceDefaultLanguage } from "../services/workspace.service";

const LANGUAGES = ["es", "en"] as const;

/**
 * The language of emails to people who have no account yet, such as a new invitee. Anyone with an
 * account gets emails in their own language, whatever this says.
 */
export default function WorkspaceEmailLanguageSettings({ slug, initial }: { slug: string; initial: string | null }) {
  const { t } = useTranslation();
  const [language, setLanguage] = useState<string | null>(initial);

  const change = async (next: string) => {
    const previous = language;
    setLanguage(next);
    try {
      await updateWorkspaceDefaultLanguage(slug, next);
      toast.success(t("workspaceEmailLanguage.saved"));
    } catch (err: any) {
      setLanguage(previous);
      if (!err?.handled) toast.error(err?.message || t("workspaceEmailLanguage.saveError"));
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted">{t("workspaceEmailLanguage.description")}</p>
      <FormInput label={t("workspaceEmailLanguage.label")}>
        <Select
          options={[...LANGUAGES]}
          label={(l) => t(`workspaceEmailLanguage.option.${l}` as any)}
          value={(l) => l === language}
          onChange={change}
          placeholder={t("workspaceEmailLanguage.unset")}
        />
      </FormInput>
    </div>
  );
}
