import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseAnalyticsConfig, type AnalyticsConfig } from "./analytics-config";
import { serializeEventProps } from "./events";

/** A minimal browser for the runtime: the Matomo queue, one origin, a referrer, storage. */
function fakeBrowser(referrer = "", stored: Record<string, string> = {}) {
  const storage = { ...stored };
  const scripts: { src: string }[] = [];
  const win = {
    _paq: [] as unknown[][],
    location: { origin: "https://help.example.com" },
    localStorage: {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => { storage[k] = v; },
    },
  };
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", {
    referrer,
    createElement: () => ({ dataset: {} }),
    head: { appendChild: (el: { src: string }) => scripts.push(el) },
  });
  return { win, scripts, storage };
}

const MATOMO: AnalyticsConfig = {
  provider: "matomo",
  serverUrl: "https://stats.example.org/",
  siteId: "3",
  useCookies: false,
  trackEvents: true,
};

async function runtime() {
  vi.resetModules();
  return import("./analytics");
}

describe("analytics runtime with Matomo", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads matomo.js once and configures a cookieless tracker without link tracking", async () => {
    const { win, scripts } = fakeBrowser();
    const { startAnalytics } = await runtime();
    startAnalytics(MATOMO);
    startAnalytics(MATOMO);

    expect(scripts.map((s) => s.src)).toEqual(["https://stats.example.org/matomo.js"]);
    expect(win._paq).toEqual([
      ["setTrackerUrl", "https://stats.example.org/matomo.php"],
      ["setSiteId", "3"],
      ["disableCookies"],
      ["enableHeartBeatTimer"],
    ]);
  });

  it("reports patterns only, from the first page view on, and the previous pattern as referrer", async () => {
    const { win } = fakeBrowser("https://help.example.com/verify-email?token=s3cr3t");
    const { startAnalytics, trackPage } = await runtime();
    startAnalytics(MATOMO);
    win._paq.length = 0;

    trackPage("/portal/tickets/s3cr3t-portal-token");
    trackPage("/portal/tickets/s3cr3t-portal-token");
    trackPage("/login");

    expect(win._paq).toEqual([
      ["setReferrerUrl", "https://help.example.com/verify-email"],
      ["setCustomUrl", "https://help.example.com/portal/tickets/:portalToken"],
      ["setDocumentTitle", "Portal ticket"],
      ["trackPageView"],
      ["setReferrerUrl", "https://help.example.com/portal/tickets/:portalToken"],
      ["setCustomUrl", "https://help.example.com/login"],
      ["setDocumentTitle", "Login"],
      ["trackPageView"],
    ]);
    expect(JSON.stringify(win._paq)).not.toContain("s3cr3t");
  });

  it("reduces an external referrer to its origin", async () => {
    const { win } = fakeBrowser("https://mail.example.net/inbox/42?q=private");
    const { startAnalytics, trackPage } = await runtime();
    startAnalytics(MATOMO);
    trackPage("/login");
    expect(win._paq).toContainEqual(["setReferrerUrl", "https://mail.example.net/"]);
  });

  it("requires consent when cookies are on, and applies a stored or new decision", async () => {
    const { win, storage } = fakeBrowser("", { analytics_cookie_consent: "accepted" });
    const { startAnalytics, decideCookieConsent } = await runtime();
    startAnalytics({ ...MATOMO, useCookies: true });

    expect(win._paq).toContainEqual(["requireCookieConsent"]);
    expect(win._paq).toContainEqual(["setCookieConsentGiven"]);
    expect(win._paq).not.toContainEqual(["disableCookies"]);

    decideCookieConsent("rejected");
    expect(win._paq[win._paq.length - 1]).toEqual(["forgetCookieConsentGiven"]);
    expect(storage.analytics_cookie_consent).toBe("rejected");

    decideCookieConsent("accepted");
    expect(win._paq[win._paq.length - 1]).toEqual(["rememberCookieConsentGiven"]);
  });

  it("sends product events only when enabled, with enum-like props", async () => {
    const { win } = fakeBrowser();
    const { startAnalytics, trackEvent } = await runtime();
    startAnalytics(MATOMO);
    trackEvent("ticket-created", { channel: "portal" });
    trackEvent("workspace-created");
    expect(win._paq.slice(-2)).toEqual([
      ["trackEvent", "product", "ticket-created", "channel=portal"],
      ["trackEvent", "product", "workspace-created"],
    ]);
  });

  it("drops product events when the operator turned them off", async () => {
    const { win } = fakeBrowser();
    const { startAnalytics, trackEvent } = await runtime();
    startAnalytics({ ...MATOMO, trackEvents: false });
    const before = win._paq.length;
    trackEvent("workspace-created");
    expect(win._paq.length).toBe(before);
  });
});

describe("analytics off", () => {
  beforeEach(() => fakeBrowser());
  afterEach(() => vi.unstubAllGlobals());

  it("does nothing before or without a provider", async () => {
    const { trackPage, trackEvent } = await runtime();
    trackPage("/login");
    trackEvent("signup-completed");
    expect((window as unknown as { _paq: unknown[] })._paq).toEqual([]);
  });
});

describe("event props", () => {
  it("serialises key=value pairs and leaves out anything that is not enum-like", () => {
    expect(serializeEventProps({ role: "agent", status: "in-progress" })).toBe("role=agent;status=in-progress");
    expect(serializeEventProps({ role: "someone@example.com" })).toBeUndefined();
    expect(serializeEventProps({ status: "a very long free text value that is not an enum" })).toBeUndefined();
    expect(serializeEventProps(undefined)).toBeUndefined();
  });
});

describe("public config", () => {
  it("accepts a well-formed Matomo config and normalises the trailing slash", () => {
    expect(parseAnalyticsConfig({ provider: "matomo", serverUrl: "https://stats.example.org/m", siteId: "3", useCookies: true, trackEvents: false }))
      .toEqual({ provider: "matomo", serverUrl: "https://stats.example.org/m/", siteId: "3", useCookies: true, trackEvents: false });
  });

  it.each([
    null,
    { provider: "umami", serverUrl: "https://a.example/", siteId: "1" },
    { provider: "matomo", serverUrl: "http://a.example/", siteId: "1" },
    { provider: "matomo", serverUrl: "https://user:pw@a.example/", siteId: "1" },
    { provider: "matomo", serverUrl: "https://a.example/?x=1", siteId: "1" },
    { provider: "matomo", serverUrl: "javascript:alert(1)", siteId: "1" },
    { provider: "matomo", serverUrl: "https://a.example/", siteId: "abc" },
  ])("turns analytics off for %j", (value) => {
    expect(parseAnalyticsConfig(value)).toBeNull();
  });
});
