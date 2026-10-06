import type { CookieConsent } from "../domain/cookie-consent";

/** One page view, already reduced to the route pattern. */
export interface PageView {
  /** origin + route pattern, never the real URL. */
  url: string;
  title: string;
  /** The previous page's pattern URL, or a sanitised external referrer, or "". */
  referrer: string;
}

/**
 * What the client needs from an analytics provider. Each provider (Matomo today; Umami or
 * Plausible later) implements this, and nothing outside its adapter knows the provider's API.
 */
export interface AnalyticsAdapter {
  /** Loads the provider once. `consent` is the visitor's stored decision, when cookies need one. */
  init(consent: CookieConsent | null): void;
  trackPageView(view: PageView): void;
  /** `name` is serialised props (`key=value;...`), or undefined. */
  trackEvent(action: string, name: string | undefined): void;
  /** The visitor accepted or rejected cookies from the banner. */
  applyConsent(consent: CookieConsent): void;
}
