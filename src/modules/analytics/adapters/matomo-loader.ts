/**
 * The official Matomo JavaScript tracker, vendored into `public/` and served from this origin.
 * Third-party tracker code is never loaded: the Matomo servers configured by the installation
 * or by a workspace only ever receive tracking requests at `<serverUrl>matomo.php`.
 *
 * Source: https://raw.githubusercontent.com/matomo-org/matomo/5.14.1/matomo.js (BSD-3-Clause,
 * license in `public/vendor/matomo/LICENSE.txt`). Upgrading means replacing the file and this
 * path together, so a cached old copy is never mixed with new code.
 */
export const MATOMO_SCRIPT_SRC = "/vendor/matomo/matomo-5.14.1.js";

/** The subset of Matomo's tracker object the adapter uses. */
export interface MatomoTracker {
  setReferrerUrl(url: string): void;
  setCustomUrl(url: string): void;
  setDocumentTitle(title: string): void;
  trackPageView(): void;
  trackEvent(category: string, action: string, name?: string): void;
  disableCookies(): void;
  requireCookieConsent(): boolean;
  setCookieConsentGiven(): void;
  rememberCookieConsentGiven(): void;
  forgetCookieConsentGiven(): void;
  enableHeartBeatTimer(): void;
  disableHeartBeatTimer(): void;
}

export interface MatomoGlobal {
  getTracker(trackerUrl: string, siteId: string): MatomoTracker;
}

declare global {
  interface Window {
    Matomo?: MatomoGlobal;
  }
}

let loading: Promise<MatomoGlobal> | null = null;

function loaded(): MatomoGlobal | null {
  const matomo = window.Matomo;
  return matomo && typeof matomo.getTracker === "function" ? matomo : null;
}

/** Loads the vendored tracker once per page; every destination shares it. */
export function loadMatomo(): Promise<MatomoGlobal> {
  if (loading) return loading;
  loading = new Promise<MatomoGlobal>((resolve, reject) => {
    const ready = loaded();
    if (ready) {
      resolve(ready);
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.src = MATOMO_SCRIPT_SRC;
    script.dataset.analytics = "matomo";
    script.onload = () => {
      const matomo = loaded();
      if (matomo) resolve(matomo);
      else reject(new Error("Matomo tracker unavailable"));
    };
    script.onerror = () => reject(new Error("Matomo tracker failed to load"));
    document.head.appendChild(script);
  });
  // A failed load (blocked by the visitor) is not retried within this page load.
  loading.catch(() => undefined);
  return loading;
}
