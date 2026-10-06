/** Web analytics providers the client knows how to load. Umami or Plausible would join this list. */
export type AnalyticsProvider = "matomo";

/** Web analytics as `GET /config/public` exposes it; null there means analytics is off. */
export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  /** https, ends with "/" (normalised by the backend). */
  serverUrl: string;
  siteId: string;
  /** false: cookieless tracking, no banner. true: a consent banner decides whether cookies are used. */
  useCookies: boolean;
  /** Whether product events (`trackEvent`) are sent, on top of page views. */
  trackEvents: boolean;
}

const SITE_ID = /^[1-9][0-9]{0,9}$/;

/**
 * Accepts the public config's `analytics` only when it is well formed, since it decides which
 * script the page loads. Anything unexpected turns analytics off instead of loading it.
 */
export function parseAnalyticsConfig(value: unknown): AnalyticsConfig | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (raw.provider !== "matomo") return null;
  if (typeof raw.serverUrl !== "string" || typeof raw.siteId !== "string") return null;
  if (!SITE_ID.test(raw.siteId)) return null;

  let url: URL;
  try {
    url = new URL(raw.serverUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
  const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;

  return {
    provider: "matomo",
    serverUrl: `${url.origin}${path}`,
    siteId: raw.siteId,
    useCookies: raw.useCookies === true,
    trackEvents: raw.trackEvents !== false,
  };
}

/** Whether visitors must be asked about cookies (and the banner and preferences link apply). */
export function needsCookieConsent(config: AnalyticsConfig | null): boolean {
  return !!config && config.provider === "matomo" && config.useCookies;
}
