import { Link } from "react-router";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import type { TranslationKey } from "@modules/app/i18n/translations";
import { needsCookieConsent, type AnalyticsConfig } from "@modules/analytics/domain/analytics-config";
import CookiePreferencesLink from "@modules/analytics/components/CookiePreferencesLink";

type Section = "collect" | "use" | "storage" | "access" | "thirdParty" | "analytics" | "rights" | "cookies" | "contact";

/** The analytics section exists only when the installation runs analytics. */
function sectionsFor(analytics: AnalyticsConfig | null): Section[] {
  return [
    "collect", "use", "storage", "access", "thirdParty",
    ...(analytics ? (["analytics"] as const) : []),
    "rights", "cookies", "contact",
  ];
}

/** The cookies text matches the configuration: no analytics, Matomo without cookies, or with them. */
function cookiesKey(analytics: AnalyticsConfig | null): TranslationKey {
  if (!analytics) return "legal.privacy.cookies.desc";
  return analytics.useCookies ? "legal.privacy.cookies.descMatomoCookies" : "legal.privacy.cookies.descMatomoCookieless";
}

function analyticsHost(analytics: AnalyticsConfig | null): string {
  try {
    return analytics ? new URL(analytics.serverUrl).host : "";
  } catch {
    return "";
  }
}

export default function PrivacyPage() {
  const { t } = useTranslation();
  const { analytics } = useConfig();

  const description = (key: Section): string => {
    if (key === "cookies") return t(cookiesKey(analytics));
    if (key === "analytics") return t("legal.privacy.analytics.desc").replace("{host}", analyticsHost(analytics));
    return t(`legal.privacy.${key}.desc` as TranslationKey);
  };

  return (
    <div className="min-h-dvh bg-surface">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/login" className="text-sm text-primary hover:underline font-body-medium">
          &larr; {t("legal.backToLogin")}
        </Link>

        <h1 className="text-3xl font-body-bold text-heading mt-6 mb-2">
          {t("legal.privacy.title")}
        </h1>

        <p className="text-body leading-relaxed mb-10">{t("legal.privacy.intro")}</p>

        {sectionsFor(analytics).map((key) => (
          <section key={key} className="mb-8">
            <h2 className="text-lg font-body-bold text-heading mb-2">
              {t(`legal.privacy.${key}.title` as TranslationKey)}
            </h2>
            <p className="text-sm text-secondary-text leading-relaxed">
              {description(key)}
            </p>
            {key === "cookies" && needsCookieConsent(analytics) && (
              <p className="text-sm mt-2">
                <CookiePreferencesLink className="text-primary hover:underline font-body-medium" />
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
