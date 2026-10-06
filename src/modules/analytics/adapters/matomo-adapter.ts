import type { AnalyticsConfig } from "../domain/analytics-config";
import type { CookieConsent } from "../domain/cookie-consent";
import type { AnalyticsAdapter, PageView } from "./analytics-adapter";

type MatomoCommand = [string, ...unknown[]];

declare global {
  interface Window {
    _paq?: MatomoCommand[];
  }
}

const EVENT_CATEGORY = "product";

/**
 * Matomo through its `_paq` command queue. Link tracking is deliberately never enabled: outlinks
 * inside tickets could carry customer URLs. Every page view sets its own URL, title and
 * referrer, so the raw browser URL is never what Matomo reports.
 */
export class MatomoAdapter implements AnalyticsAdapter {
  constructor(private readonly config: AnalyticsConfig) {}

  private push(command: MatomoCommand): void {
    window._paq = window._paq || [];
    window._paq.push(command);
  }

  init(consent: CookieConsent | null): void {
    const { serverUrl, siteId, useCookies } = this.config;

    this.push(["setTrackerUrl", `${serverUrl}matomo.php`]);
    this.push(["setSiteId", siteId]);

    if (!useCookies) {
      this.push(["disableCookies"]);
    } else {
      // Tracks without cookies until the visitor accepts them.
      this.push(["requireCookieConsent"]);
      if (consent === "accepted") this.push(["setCookieConsentGiven"]);
    }

    this.push(["enableHeartBeatTimer"]);

    const script = document.createElement("script");
    script.async = true;
    script.src = `${serverUrl}matomo.js`;
    script.dataset.analytics = "matomo";
    document.head.appendChild(script);
  }

  trackPageView({ url, title, referrer }: PageView): void {
    this.push(["setReferrerUrl", referrer]);
    this.push(["setCustomUrl", url]);
    this.push(["setDocumentTitle", title]);
    this.push(["trackPageView"]);
  }

  trackEvent(action: string, name: string | undefined): void {
    this.push(name ? ["trackEvent", EVENT_CATEGORY, action, name] : ["trackEvent", EVENT_CATEGORY, action]);
  }

  applyConsent(consent: CookieConsent): void {
    if (!this.config.useCookies) return;
    this.push([consent === "accepted" ? "rememberCookieConsentGiven" : "forgetCookieConsentGiven"]);
  }
}
