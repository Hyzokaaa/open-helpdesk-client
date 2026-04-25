import useUser from "@modules/user/hooks/useUser";
import { LOCAL_STORAGE_KEY, LocalStorage } from "@modules/app/domain/core/local-storage";

export default function LanguageToggle() {
  const { user, setUser } = useUser();
  const current = user?.language || LocalStorage.get(LOCAL_STORAGE_KEY.LANGUAGE) || "en";
  const label = current === "en" ? "EN" : "ES";

  const toggle = () => {
    const next = current === "en" ? "es" : "en";
    LocalStorage.set(LOCAL_STORAGE_KEY.LANGUAGE, next);
    if (user) {
      setUser({ ...user, language: next });
    } else {
      window.dispatchEvent(new Event("languagechange"));
    }
  };

  return (
    <button
      onClick={toggle}
      className="w-8 h-8 flex items-center justify-center rounded-button border border-border-input bg-surface hover:bg-surface-hover transition-all duration-300 cursor-pointer text-xs font-body-bold text-muted hover:text-body"
    >
      {label}
    </button>
  );
}
