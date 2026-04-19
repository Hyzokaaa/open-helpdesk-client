import { useCallback } from "react";
import useUser from "@modules/user/hooks/useUser";
import translations, { TranslationKey } from "./translations";

export default function useTranslation() {
  const { user } = useUser();
  const lang = user?.language || "en";

  const t = useCallback(
    (key: TranslationKey): string => {
      const entry = translations[key];
      if (!entry) return key;
      return (entry as Record<string, string>)[lang] || (entry as Record<string, string>)["en"] || key;
    },
    [lang],
  );

  const tEnum = useCallback(
    (prefix: string, value: string): string => {
      const key = `enum.${prefix}.${value}` as TranslationKey;
      const entry = translations[key];
      if (!entry) return value;
      return (entry as Record<string, string>)[lang] || (entry as Record<string, string>)["en"] || value;
    },
    [lang],
  );

  return { t, tEnum, lang };
}
