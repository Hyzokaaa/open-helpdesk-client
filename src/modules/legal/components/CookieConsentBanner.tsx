import { useState } from "react";
import useTranslation from "@modules/app/i18n/useTranslation";

const STORAGE_KEY = "cookie_consent_accepted";

export default function CookieConsentBanner() {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");

  if (accepted) return null;

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setAccepted(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-surface border-t border-border-card shadow-lg px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <p className="text-xs text-secondary-text">
          {t("cookie.message")}{" "}
          <a href="/privacy" className="text-primary hover:underline">{t("cookie.learnMore")}</a>
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 px-4 py-1.5 bg-primary text-white text-xs font-body-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          {t("cookie.accept")}
        </button>
      </div>
    </div>
  );
}
