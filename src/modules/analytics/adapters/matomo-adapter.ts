import type { AnalyticsConfig } from "../domain/analytics-config";
import type { CookieConsent } from "../domain/cookie-consent";
import type { AnalyticsAdapter, PageView } from "./analytics-adapter";
import { loadMatomo, type MatomoTracker } from "./matomo-loader";

const EVENT_CATEGORY = "product";

type Command = (tracker: MatomoTracker) => void;

/**
 * One Matomo destination as its own tracker object (`Matomo.getTracker`), so the installation's
 * and a workspace's trackers never share configuration and either can stop receiving hits.
 * Link tracking is deliberately never enabled: outlinks inside tickets could carry customer
 * URLs. Every page view sets its own URL, title and referrer, so the raw browser URL is never
 * what Matomo reports. Calls made before the vendored script loads are queued in order.
 */
export class MatomoAdapter implements AnalyticsAdapter {
  private tracker: MatomoTracker | null = null;
  private queue: Command[] = [];
  private failed = false;
  private paused = false;

  constructor(private readonly config: AnalyticsConfig) {}

  private run(command: Command): void {
    if (this.failed) return;
    if (!this.tracker) {
      this.queue.push(command);
      return;
    }
    try {
      command(this.tracker);
    } catch {
      // Analytics must never break the page.
    }
  }

  init(consent: CookieConsent | null): void {
    const { serverUrl, siteId, useCookies } = this.config;

    this.run((tracker) => {
      if (!useCookies) {
        tracker.disableCookies();
      } else if (consent === "accepted") {
        tracker.requireCookieConsent();
        tracker.setCookieConsentGiven();
      } else {
        // Tracks without cookies until the visitor accepts them, even if Matomo remembers an
        // older consent cookie: the banner's stored decision is what counts.
        tracker.requireCookieConsent();
        tracker.disableCookies();
      }
      tracker.enableHeartBeatTimer();
    });

    loadMatomo().then(
      (matomo) => {
        this.tracker = matomo.getTracker(`${serverUrl}matomo.php`, siteId);
        const pending = this.queue;
        this.queue = [];
        pending.forEach((command) => this.run(command));
      },
      () => {
        this.failed = true;
        this.queue = [];
      },
    );
  }

  trackPageView({ url, title, referrer }: PageView): void {
    const resume = this.paused;
    this.paused = false;
    this.run((tracker) => {
      if (resume) tracker.enableHeartBeatTimer();
      tracker.setReferrerUrl(referrer);
      tracker.setCustomUrl(url);
      tracker.setDocumentTitle(title);
      tracker.trackPageView();
    });
  }

  trackEvent(action: string, name: string | undefined): void {
    this.run((tracker) => {
      if (name) tracker.trackEvent(EVENT_CATEGORY, action, name);
      else tracker.trackEvent(EVENT_CATEGORY, action);
    });
  }

  applyConsent(consent: CookieConsent): void {
    if (!this.config.useCookies) return;
    this.run((tracker) => {
      if (consent === "accepted") tracker.rememberCookieConsentGiven();
      else tracker.forgetCookieConsentGiven();
    });
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
    this.run((tracker) => tracker.disableHeartBeatTimer());
  }
}
