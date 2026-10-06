import useTranslation from "@modules/app/i18n/useTranslation";
import useCookieConsent from "../hooks/useCookieConsent";
import { openCookiePreferences } from "../domain/cookie-consent";

interface Props {
  /** Renders a leading "·" like the legal links it sits next to. */
  separator?: boolean;
  className?: string;
}

/** Reopens the cookie banner. Renders nothing when no tracker measuring the current page asks for consent. */
export default function CookiePreferencesLink({ separator = false, className = "hover:text-heading transition-colors" }: Props) {
  const { t } = useTranslation();
  const { applies } = useCookieConsent();

  if (!applies) return null;

  return (
    <>
      {separator && <span>·</span>}
      <button type="button" onClick={openCookiePreferences} className={`${className} cursor-pointer`}>
        {t("cookie.preferences")}
      </button>
    </>
  );
}
