import { createContext, useState, useCallback } from "react";

type Lang = "en" | "es";

interface LanguageContextProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

export const LanguageContext = createContext<LanguageContextProps>({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
});

function getInitialLang(): Lang {
  const stored = localStorage.getItem("lang");
  if (stored === "en" || stored === "es") return stored;
  return navigator.language.startsWith("es") ? "es" : "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "en" ? "es" : "en";
      localStorage.setItem("lang", next);
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}
