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
 * One analytics destination: a provider plus the server and site it reports to. The page can
 * hold several at once (the installation's and a workspace's), each its own instance, so one
 * can stop receiving hits without touching the others. Each provider (Matomo today; Umami or
 * Plausible later) implements this, and nothing outside its adapter knows the provider's API.
 */
export interface AnalyticsAdapter {
  /** Starts the destination once. `consent` is the visitor's stored decision, when cookies need one. */
  init(consent: CookieConsent | null): void;
  trackPageView(view: PageView): void;
  /** `name` is serialised props (`key=value;...`), or undefined. */
  trackEvent(action: string, name: string | undefined): void;
  /** The visitor accepted or rejected cookies from the banner. */
  applyConsent(consent: CookieConsent): void;
  /** The destination stops receiving hits for now (the visitor left its workspace): stop background pings. */
  pause(): void;
}
