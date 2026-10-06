import type { AnalyticsAdapter } from "../adapters/analytics-adapter";
import { MatomoAdapter } from "../adapters/matomo-adapter";
import { needsCookieConsent, type AnalyticsConfig } from "./analytics-config";
import { readCookieConsent, setCookieConsentDecision, type CookieConsent } from "./cookie-consent";
import { serializeEventProps, type AnalyticsEventArgs, type AnalyticsEventName } from "./events";
import { resolveAnalyticsRoute } from "./route-catalogue";

/**
 * The analytics runtime: one provider per page load, started by `AnalyticsTracker` once the
 * public config arrives. Everything here is a no-op until then, and stays one when analytics is
 * off, so callers can report events without checking anything. Analytics never throws into the
 * code that calls it.
 */

let adapter: AnalyticsAdapter | null = null;
let config: AnalyticsConfig | null = null;
let lastPathname: string | null = null;
let lastPageUrl: string | null = null;

function createAdapter(value: AnalyticsConfig): AnalyticsAdapter {
  switch (value.provider) {
    case "matomo":
      return new MatomoAdapter(value);
  }
}

/** Loads the provider. Later calls are ignored: a settings change applies on the next page load. */
export function startAnalytics(value: AnalyticsConfig): void {
  if (adapter) return;
  try {
    const next = createAdapter(value);
    next.init(needsCookieConsent(value) ? readCookieConsent() : null);
    adapter = next;
    config = value;
  } catch {
    adapter = null;
    config = null;
  }
}

/**
 * The referrer of the first page view. A same-origin referrer is reduced to its route pattern
 * (a full reload from `/verify-email?token=...` must not leak the token); an external one to
 * its origin.
 */
function initialReferrer(): string {
  try {
    if (!document.referrer) return "";
    const ref = new URL(document.referrer);
    if (ref.origin === window.location.origin) return ref.origin + resolveAnalyticsRoute(ref.pathname).pattern;
    return `${ref.origin}/`;
  } catch {
    return "";
  }
}

/**
 * Reports a page view for a pathname as its route pattern. The same pathname twice in a row is
 * reported once, which also absorbs React StrictMode's double effects.
 */
export function trackPage(pathname: string): void {
  if (!adapter || pathname === lastPathname) return;
  try {
    const route = resolveAnalyticsRoute(pathname);
    const url = window.location.origin + route.pattern;
    adapter.trackPageView({ url, title: route.title, referrer: lastPageUrl ?? initialReferrer() });
    lastPathname = pathname;
    lastPageUrl = url;
  } catch {
    // Analytics must never break navigation.
  }
}

/**
 * Reports a product event after an action succeeded. No-op unless analytics is on and the
 * operator enabled product events. Props are enum-like values only (see `events.ts`).
 */
export function trackEvent<E extends AnalyticsEventName>(name: E, ...args: AnalyticsEventArgs<E>): void {
  if (!adapter || !config?.trackEvents) return;
  try {
    adapter.trackEvent(name, serializeEventProps(args[0] as Record<string, string> | undefined));
  } catch {
    // Analytics must never break the action that reported it.
  }
}

/** Stores the visitor's banner decision and applies it to the provider. */
export function decideCookieConsent(consent: CookieConsent): void {
  setCookieConsentDecision(consent);
  try {
    adapter?.applyConsent(consent);
  } catch {
    // The stored decision still applies from the next page load.
  }
}
