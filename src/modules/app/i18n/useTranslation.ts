import { useCallback, useEffect, useState } from "react";
import useUser from "@modules/user/hooks/useUser";
import { LOCAL_STORAGE_KEY, LocalStorage } from "@modules/app/domain/core/local-storage";
import translations, { TranslationKey } from "./translations";

export default function useTranslation() {
  const { user } = useUser();
  const [localLang, setLocalLang] = useState(
    () => LocalStorage.get(LOCAL_STORAGE_KEY.LANGUAGE) || "en",
  );

  useEffect(() => {
    const handler = () => setLocalLang(LocalStorage.get(LOCAL_STORAGE_KEY.LANGUAGE) || "en");
    window.addEventListener("languagechange", handler);
    return () => window.removeEventListener("languagechange", handler);
  }, []);

  const lang = user?.language || localLang;

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
