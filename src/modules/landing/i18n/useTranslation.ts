import { useCallback, useContext } from "react";
import { LanguageContext } from "./LanguageContext";
import translations, { TranslationKey } from "./translations";

export default function useTranslation() {
  const { lang, setLang, toggleLang } = useContext(LanguageContext);

  const t = useCallback(
    (key: TranslationKey): string => {
      const entry = translations[key];
      if (!entry) return key;
      return (entry as Record<string, string>)[lang] || (entry as Record<string, string>)["en"] || key;
    },
    [lang],
  );

  return { t, lang, setLang, toggleLang };
}
