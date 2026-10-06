import { Link } from "react-router";
import useTranslation from "@modules/app/i18n/useTranslation";
import useCookieConsent from "../hooks/useCookieConsent";
import { decideCookieConsent } from "../domain/analytics";

/** Accept and Reject share one style on purpose: neither answer is nudged. */
const CHOICE_CLASS =
  "shrink-0 px-4 py-1.5 border border-border-card bg-surface text-heading text-xs font-body-medium rounded-lg hover:bg-surface-hover transition-colors cursor-pointer";

/**
 * Asks about analytics cookies. Shown only when the installation runs Matomo with cookies and
 * the visitor has not answered yet, or reopened it from "Cookie preferences". Until an answer,
 * Matomo measures without cookies.
 */
export default function CookieConsentBanner() {
  const { t } = useTranslation();
  const { applies, consent, preferencesOpen } = useCookieConsent();

  if (!applies || (consent !== null && !preferencesOpen)) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("cookie.preferences")}
      className="fixed bottom-0 left-0 right-0 z-[100] bg-surface border-t border-border-card shadow-lg px-4 py-3"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-secondary-text">
          {t("cookie.message")}{" "}
          {consent && <>{t(consent === "accepted" ? "cookie.currentAccepted" : "cookie.currentRejected")}{" "}</>}
          <Link to="/privacy" className="text-primary hover:underline">{t("cookie.learnMore")}</Link>
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => decideCookieConsent("rejected")} className={CHOICE_CLASS}>
            {t("cookie.reject")}
          </button>
          <button type="button" onClick={() => decideCookieConsent("accepted")} className={CHOICE_CLASS}>
            {t("cookie.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
