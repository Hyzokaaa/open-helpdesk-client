import { Link } from "react-router";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import type { TranslationKey } from "@modules/app/i18n/translations";
import { needsCookieConsent, type AnalyticsConfig } from "@modules/analytics/domain/analytics-config";
import CookiePreferencesLink from "@modules/analytics/components/CookiePreferencesLink";
import useAnalyticsScope from "@modules/analytics/hooks/useAnalyticsScope";
import type { AnalyticsScope } from "@modules/analytics/domain/analytics";

type Section = "collect" | "use" | "storage" | "access" | "thirdParty" | "analytics" | "workspaceAnalytics" | "rights" | "cookies" | "contact";

type ScopedWorkspace = NonNullable<AnalyticsScope["workspace"]>;

/**
 * The workspace section exists when the visitor came from a workspace (or is on its custom
 * domain) that measures with its own Matomo, or that keeps its usage out of the installation's
 * analytics.
 */
function describesWorkspace(installation: AnalyticsConfig | null, workspace: ScopedWorkspace | null): workspace is ScopedWorkspace {
  return !!workspace && (!!workspace.analytics || (!!installation && !workspace.shareWithInstallation));
}

/** The analytics sections exist only when the installation, or the workspace, runs analytics. */
function sectionsFor(analytics: AnalyticsConfig | null, workspace: ScopedWorkspace | null): Section[] {
  return [
    "collect", "use", "storage", "access", "thirdParty",
    ...(analytics ? (["analytics"] as const) : []),
    ...(describesWorkspace(analytics, workspace) ? (["workspaceAnalytics"] as const) : []),
    "rights", "cookies", "contact",
  ];
}

/** The cookies text matches the configuration: no analytics, Matomo without cookies, or with them (by anyone). */
function cookiesKey(analytics: AnalyticsConfig | null, workspace: AnalyticsConfig | null): TranslationKey {
  if (!analytics && !workspace) return "legal.privacy.cookies.desc";
  return needsCookieConsent(analytics) || needsCookieConsent(workspace)
    ? "legal.privacy.cookies.descMatomoCookies"
    : "legal.privacy.cookies.descMatomoCookieless";
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
  const scoped = useAnalyticsScope().workspace;
  const workspace = describesWorkspace(analytics, scoped) ? scoped : null;
  const workspaceName = workspace?.name || t("legal.privacy.workspaceAnalytics.thisOrganisation");

  /** What the workspace measures itself, then whether the installation's analytics covers it too. */
  const workspaceDescription = (ws: ScopedWorkspace): string => {
    const parts: string[] = [];
    if (ws.analytics) {
      parts.push(t("legal.privacy.workspaceAnalytics.desc").replace("{host}", analyticsHost(ws.analytics)));
      parts.push(t(ws.analytics.useCookies ? "legal.privacy.workspaceAnalytics.cookies" : "legal.privacy.workspaceAnalytics.cookieless"));
    }
    if (analytics) {
      parts.push(t(ws.shareWithInstallation ? "legal.privacy.workspaceAnalytics.shared" : "legal.privacy.workspaceAnalytics.notShared"));
    }
    return parts.join(" ").replaceAll("{workspace}", workspaceName);
  };

  const title = (key: Section): string =>
    key === "workspaceAnalytics"
      ? t("legal.privacy.workspaceAnalytics.title").replace("{workspace}", workspaceName)
      : t(`legal.privacy.${key}.title` as TranslationKey);

  const description = (key: Section): string => {
    if (key === "cookies") return t(cookiesKey(analytics, workspace?.analytics ?? null));
    if (key === "analytics") return t("legal.privacy.analytics.desc").replace("{host}", analyticsHost(analytics));
    if (key === "workspaceAnalytics") return workspace ? workspaceDescription(workspace) : "";
    return t(`legal.privacy.${key}.desc` as TranslationKey);
  };

  const asksConsent = needsCookieConsent(analytics) || needsCookieConsent(workspace?.analytics ?? null);

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

        {sectionsFor(analytics, workspace).map((key) => (
          <section key={key} className="mb-8">
            <h2 className="text-lg font-body-bold text-heading mb-2">
              {title(key)}
            </h2>
            <p className="text-sm text-secondary-text leading-relaxed">
              {description(key)}
            </p>
            {key === "cookies" && asksConsent && (
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
