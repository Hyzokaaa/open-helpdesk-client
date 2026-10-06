import { afterEach, describe, expect, it, vi } from "vitest";
import { parseAnalyticsConfig, type AnalyticsConfig } from "./analytics-config";
import { serializeEventProps } from "./events";
import type { WorkspaceAnalytics } from "./analytics";
import { MATOMO_SCRIPT_SRC } from "../adapters/matomo-loader";

type Call = [string, ...unknown[]];

interface FakeTracker {
  trackerUrl: string;
  siteId: string;
  calls: Call[];
}

/** A Matomo tracker object that records every method called on it. */
function fakeTracker(trackerUrl: string, siteId: string): FakeTracker & Record<string, unknown> {
  const record: FakeTracker = { trackerUrl, siteId, calls: [] };
  return new Proxy(record as FakeTracker & Record<string, unknown>, {
    get(target, prop: string) {
      if (prop in target) return target[prop as keyof FakeTracker];
      return (...args: unknown[]) => {
        target.calls.push([prop, ...args]);
        return prop === "requireCookieConsent" ? true : undefined;
      };
    },
  });
}

/**
 * A minimal browser for the runtime: one origin, a referrer, storage, and a document whose
 * `<script>` injection "loads" the vendored tracker, exposing `window.Matomo.getTracker`.
 */
function fakeBrowser(referrer = "", stored: Record<string, string> = {}) {
  const storage = { ...stored };
  const scripts: { src: string }[] = [];
  const trackers: FakeTracker[] = [];
  const matomo = {
    getTracker: (url: string, siteId: string) => {
      const tracker = fakeTracker(url, siteId);
      trackers.push(tracker);
      return tracker;
    },
  };
  const win: Record<string, unknown> = {
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
    head: {
      appendChild: (el: { src: string; onload?: () => void }) => {
        scripts.push(el);
        setTimeout(() => {
          win.Matomo = matomo;
          el.onload?.();
        }, 0);
      },
    },
  });
  const trackerFor = (url: string) => trackers.filter((t) => t.trackerUrl === url);
  return { win, scripts, storage, trackers, trackerFor };
}

/** Lets the script load and the runtime's queue drain. */
async function settle() {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

const MATOMO: AnalyticsConfig = {
  provider: "matomo",
  serverUrl: "https://stats.example.org/",
  siteId: "3",
  useCookies: false,
  trackEvents: true,
};

const INSTALLATION_URL = "https://stats.example.org/matomo.php";

const ACME: AnalyticsConfig = {
  provider: "matomo",
  serverUrl: "https://matomo.acme.test/",
  siteId: "7",
  useCookies: false,
  trackEvents: true,
};
const ACME_URL = "https://matomo.acme.test/matomo.php";

const GLOBEX: AnalyticsConfig = { ...ACME, serverUrl: "https://stats.globex.test/", siteId: "9" };
const GLOBEX_URL = "https://stats.globex.test/matomo.php";

async function runtime() {
  vi.resetModules();
  return import("./analytics");
}

function pageViews(tracker: FakeTracker | undefined): unknown[] {
  return (tracker?.calls ?? []).filter((c) => c[0] === "setCustomUrl").map((c) => c[1]);
}

function last(calls: Call[]): Call | undefined {
  return calls[calls.length - 1];
}

function events(tracker: FakeTracker | undefined): Call[] {
  return (tracker?.calls ?? []).filter((c) => c[0] === "trackEvent");
}

describe("analytics runtime with the installation's Matomo", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads the vendored tracker once and configures a cookieless tracker object without link tracking", async () => {
    const { scripts, trackers } = fakeBrowser();
    const { startAnalytics } = await runtime();
    startAnalytics(MATOMO);
    startAnalytics(MATOMO);
    await settle();

    expect(scripts.map((s) => s.src)).toEqual([MATOMO_SCRIPT_SRC]);
    expect(trackers).toHaveLength(1);
    expect(trackers[0].trackerUrl).toBe(INSTALLATION_URL);
    expect(trackers[0].siteId).toBe("3");
    expect(trackers[0].calls).toEqual([["disableCookies"], ["enableHeartBeatTimer"]]);
  });

  it("reports patterns only, from the first page view on, and the previous pattern as referrer", async () => {
    const { trackers } = fakeBrowser("https://help.example.com/verify-email?token=s3cr3t");
    const { startAnalytics, trackPage } = await runtime();
    startAnalytics(MATOMO);

    trackPage("/portal/tickets/s3cr3t-portal-token");
    trackPage("/portal/tickets/s3cr3t-portal-token");
    trackPage("/login");
    await settle();

    expect(trackers[0].calls.slice(2)).toEqual([
      ["setReferrerUrl", "https://help.example.com/verify-email"],
      ["setCustomUrl", "https://help.example.com/portal/tickets/:portalToken"],
      ["setDocumentTitle", "Portal ticket"],
      ["trackPageView"],
      ["setReferrerUrl", "https://help.example.com/portal/tickets/:portalToken"],
      ["setCustomUrl", "https://help.example.com/login"],
      ["setDocumentTitle", "Login"],
      ["trackPageView"],
    ]);
    expect(JSON.stringify(trackers)).not.toContain("s3cr3t");
  });

  it("reduces an external referrer to its origin", async () => {
    const { trackers } = fakeBrowser("https://mail.example.net/inbox/42?q=private");
    const { startAnalytics, trackPage } = await runtime();
    startAnalytics(MATOMO);
    trackPage("/login");
    await settle();
    expect(trackers[0].calls).toContainEqual(["setReferrerUrl", "https://mail.example.net/"]);
  });

  it("requires consent when cookies are on, and applies a stored or new decision", async () => {
    const { trackers, storage } = fakeBrowser("", { analytics_cookie_consent: "accepted" });
    const { startAnalytics, decideCookieConsent } = await runtime();
    startAnalytics({ ...MATOMO, useCookies: true });
    await settle();

    expect(trackers[0].calls).toContainEqual(["requireCookieConsent"]);
    expect(trackers[0].calls).toContainEqual(["setCookieConsentGiven"]);
    expect(trackers[0].calls).not.toContainEqual(["disableCookies"]);

    decideCookieConsent("rejected");
    await settle();
    expect(last(trackers[0].calls)).toEqual(["forgetCookieConsentGiven"]);
    expect(storage.analytics_cookie_consent).toBe("rejected");

    decideCookieConsent("accepted");
    await settle();
    expect(last(trackers[0].calls)).toEqual(["rememberCookieConsentGiven"]);
  });

  it("keeps cookies off until the visitor accepts, even if Matomo remembers an older consent", async () => {
    const { trackers } = fakeBrowser("", { analytics_cookie_consent: "rejected" });
    const { startAnalytics } = await runtime();
    startAnalytics({ ...MATOMO, useCookies: true });
    await settle();
    expect(trackers[0].calls.slice(0, 2)).toEqual([["requireCookieConsent"], ["disableCookies"]]);
  });

  it("sends product events only when enabled, with enum-like props", async () => {
    const { trackers } = fakeBrowser();
    const { startAnalytics, trackEvent } = await runtime();
    startAnalytics(MATOMO);
    trackEvent("ticket-created", { channel: "portal" });
    trackEvent("workspace-created");
    await settle();
    expect(events(trackers[0])).toEqual([
      ["trackEvent", "product", "ticket-created", "channel=portal"],
      ["trackEvent", "product", "workspace-created"],
    ]);
  });

  it("drops product events when the operator turned them off", async () => {
    const { trackers } = fakeBrowser();
    const { startAnalytics, trackEvent } = await runtime();
    startAnalytics({ ...MATOMO, trackEvents: false });
    trackEvent("workspace-created");
    await settle();
    expect(events(trackers[0])).toEqual([]);
  });
});

describe("analytics off", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("does nothing before or without a provider, and loads no script", async () => {
    const { scripts, trackers } = fakeBrowser();
    const { startAnalytics, setAnalyticsContext, setWorkspaceAnalyticsLoader, trackPage, trackEvent } = await runtime();
    trackPage("/login");
    trackEvent("signup-completed");
    startAnalytics(null);
    setWorkspaceAnalyticsLoader(async () => ({ analytics: null, shareWithInstallation: true, name: null }));
    setAnalyticsContext("acme");
    trackPage("/portal/acme");
    trackEvent("ticket-created", { channel: "portal" });
    await settle();
    expect(scripts).toEqual([]);
    expect(trackers).toEqual([]);
  });
});

describe("routing hits between the installation and workspaces", () => {
  afterEach(() => vi.unstubAllGlobals());

  const SETTINGS: Record<string, WorkspaceAnalytics> = {
    "acme-s3cr3t": { analytics: ACME, shareWithInstallation: true, name: "Acme" },
    "globex-s3cr3t": { analytics: GLOBEX, shareWithInstallation: true, name: "Globex" },
    "private-s3cr3t": { analytics: ACME, shareWithInstallation: false, name: "Private" },
    "quiet-s3cr3t": { analytics: null, shareWithInstallation: false, name: null },
    "plain-s3cr3t": { analytics: null, shareWithInstallation: true, name: null },
  };

  async function start(installation: AnalyticsConfig | null = MATOMO, settings = SETTINGS) {
    const browser = fakeBrowser();
    const rt = await runtime();
    rt.setWorkspaceAnalyticsLoader(async (slug) => settings[slug] ?? { analytics: null, shareWithInstallation: true, name: null });
    rt.startAnalytics(installation);
    /** Navigates like `AnalyticsTracker`: context first, then the page view. */
    const visit = (slug: string | null, path: string) => {
      rt.setAnalyticsContext(slug);
      rt.trackPage(path);
    };
    return { ...browser, ...rt, visit };
  }

  it("sends pages outside any workspace to the installation only", async () => {
    const { visit, trackers, trackerFor } = await start();
    visit(null, "/login");
    visit(null, "/dashboard/settings/account");
    await settle();
    expect(trackers).toHaveLength(1);
    expect(pageViews(trackerFor(INSTALLATION_URL)[0])).toEqual([
      "https://help.example.com/login",
      "https://help.example.com/dashboard/settings/account",
    ]);
  });

  it("sends a sharing workspace's pages and events to both, with the same pattern and title", async () => {
    const { visit, trackEvent, trackerFor } = await start();
    visit("acme-s3cr3t", "/portal/acme-s3cr3t");
    trackEvent("ticket-created", { channel: "portal" });
    await settle();

    const installation = trackerFor(INSTALLATION_URL)[0];
    const acme = trackerFor(ACME_URL)[0];
    expect(acme.siteId).toBe("7");
    expect(pageViews(installation)).toEqual(["https://help.example.com/portal/:workspaceSlug"]);
    expect(pageViews(acme)).toEqual(["https://help.example.com/portal/:workspaceSlug"]);
    expect(acme.calls).toContainEqual(["setDocumentTitle", "Portal"]);
    expect(events(installation)).toEqual([["trackEvent", "product", "ticket-created", "channel=portal"]]);
    expect(events(acme)).toEqual([["trackEvent", "product", "ticket-created", "channel=portal"]]);
  });

  it("keeps a non-sharing workspace's pages and events out of the installation's tracker", async () => {
    const { visit, trackEvent, trackerFor } = await start();
    visit(null, "/login");
    visit("private-s3cr3t", "/dashboard/workspaces/private-s3cr3t/tickets");
    trackEvent("comment-created", { visibility: "public" });
    visit(null, "/dashboard/notifications");
    await settle();

    const installation = trackerFor(INSTALLATION_URL)[0];
    const own = trackerFor(ACME_URL)[0];
    expect(pageViews(installation)).toEqual(["https://help.example.com/login", "https://help.example.com/dashboard/notifications"]);
    expect(events(installation)).toEqual([]);
    // The installation's referrer is the last page it received, never the workspace's page.
    expect(installation.calls).toContainEqual(["setReferrerUrl", "https://help.example.com/login"]);
    expect(pageViews(own)).toEqual(["https://help.example.com/dashboard/workspaces/:workspaceSlug/tickets"]);
    expect(events(own)).toEqual([["trackEvent", "product", "comment-created", "visibility=public"]]);
  });

  it("sends nothing at all for a workspace that neither shares nor has its own tracker", async () => {
    const { visit, trackEvent, trackers, trackerFor } = await start();
    visit("quiet-s3cr3t", "/portal/quiet-s3cr3t");
    trackEvent("ticket-created", { channel: "portal" });
    await settle();
    expect(trackers).toHaveLength(1);
    expect(pageViews(trackerFor(INSTALLATION_URL)[0])).toEqual([]);
    expect(events(trackerFor(INSTALLATION_URL)[0])).toEqual([]);
  });

  it("measures a workspace with its own tracker when the installation has analytics off", async () => {
    const { visit, trackers, trackerFor } = await start(null);
    visit(null, "/login");
    visit("acme-s3cr3t", "/portal/acme-s3cr3t/kb");
    await settle();
    expect(trackers).toHaveLength(1);
    expect(pageViews(trackerFor(ACME_URL)[0])).toEqual(["https://help.example.com/portal/:workspaceSlug/kb"]);
  });

  it("never sends one workspace's pages to another workspace's tracker when switching", async () => {
    const { visit, trackerFor } = await start();
    visit("acme-s3cr3t", "/dashboard/workspaces/acme-s3cr3t/tickets");
    visit("globex-s3cr3t", "/dashboard/workspaces/globex-s3cr3t/reports");
    visit(null, "/dashboard");
    visit("acme-s3cr3t", "/dashboard/workspaces/acme-s3cr3t/members");
    await settle();

    const acme = trackerFor(ACME_URL);
    const globex = trackerFor(GLOBEX_URL);
    // One tracker object per workspace, reused when the visitor returns.
    expect(acme).toHaveLength(1);
    expect(globex).toHaveLength(1);
    expect(pageViews(acme[0])).toEqual([
      "https://help.example.com/dashboard/workspaces/:workspaceSlug/tickets",
      "https://help.example.com/dashboard/workspaces/:workspaceSlug/members",
    ]);
    expect(pageViews(globex[0])).toEqual(["https://help.example.com/dashboard/workspaces/:workspaceSlug/reports"]);
    // A workspace's referrer is its own previous page, never another workspace's or an outside page.
    expect(acme[0].calls).toContainEqual(["setReferrerUrl", "https://help.example.com/dashboard/workspaces/:workspaceSlug/tickets"]);
    expect(globex[0].calls).toContainEqual(["setReferrerUrl", ""]);
    // Leaving a workspace stops its heartbeat; returning restarts it.
    expect(acme[0].calls.filter((c) => c[0] === "disableHeartBeatTimer")).toHaveLength(1);
    expect(globex[0].calls.filter((c) => c[0] === "disableHeartBeatTimer")).toHaveLength(1);
    expect(pageViews(trackerFor(INSTALLATION_URL)[0])).toHaveLength(4);
  });

  it("routes an event by the page it happened on, even while the workspace's settings are loading", async () => {
    const browser = fakeBrowser();
    const rt = await runtime();
    let release: (value: WorkspaceAnalytics) => void = () => undefined;
    rt.setWorkspaceAnalyticsLoader(() => new Promise((resolve) => { release = resolve; }));
    rt.startAnalytics(MATOMO);
    rt.setAnalyticsContext("private-s3cr3t");
    rt.trackEvent("ticket-created", { channel: "dashboard" });
    rt.trackPage("/dashboard/workspaces/private-s3cr3t/tickets/new");
    await settle();
    release({ analytics: ACME, shareWithInstallation: false, name: "Private" });
    await settle();

    expect(events(browser.trackerFor(INSTALLATION_URL)[0])).toEqual([]);
    expect(pageViews(browser.trackerFor(INSTALLATION_URL)[0])).toEqual([]);
    expect(events(browser.trackerFor(ACME_URL)[0])).toEqual([["trackEvent", "product", "ticket-created", "channel=dashboard"]]);
  });

  it("shares nothing on behalf of a workspace whose settings cannot be read", async () => {
    const browser = fakeBrowser();
    const rt = await runtime();
    rt.setWorkspaceAnalyticsLoader(() => Promise.reject(new Error("offline")));
    rt.startAnalytics(MATOMO);
    rt.setAnalyticsContext("acme-s3cr3t");
    rt.trackPage("/portal/acme-s3cr3t");
    await settle();
    expect(pageViews(browser.trackerFor(INSTALLATION_URL)[0])).toEqual([]);
  });

  it("never puts a slug, token, id or query string in any tracker call", async () => {
    const { visit, trackEvent, trackers } = await start();
    visit("acme-s3cr3t", "/portal/acme-s3cr3t/kb/article/s3cr3t-article");
    visit("acme-s3cr3t", "/dashboard/workspaces/acme-s3cr3t/tickets/01HZXS3CR3TV9J8Q2W4E6R8T0Y");
    visit(null, "/portal/tickets/s3cr3t-portal-token");
    visit(null, "/reset-password?token=s3cr3t");
    trackEvent("member-invited", { role: "s3cr3t@example.com" });
    await settle();
    expect(trackers.length).toBeGreaterThan(1);
    expect(JSON.stringify(trackers.map((t) => t.calls))).not.toMatch(/s3cr3t|S3CR3T|@/);
  });

  it("only ever injects the vendored tracker script, whatever servers are configured", async () => {
    const { visit, scripts, trackers } = await start();
    visit("acme-s3cr3t", "/portal/acme-s3cr3t");
    visit("globex-s3cr3t", "/portal/globex-s3cr3t");
    await settle();
    expect(trackers).toHaveLength(3);
    expect(scripts.map((s) => s.src)).toEqual([MATOMO_SCRIPT_SRC]);
    expect(MATOMO_SCRIPT_SRC).toMatch(/^\/vendor\/matomo\/matomo-\d+\.\d+\.\d+\.js$/);
  });

  it("applies one consent decision to every tracker that uses cookies, and keeps the others cookieless", async () => {
    const settings: Record<string, WorkspaceAnalytics> = {
      acme: { analytics: { ...ACME, useCookies: true }, shareWithInstallation: true, name: "Acme" },
    };
    const { visit, decideCookieConsent, trackerFor, getAnalyticsScope } = await start(MATOMO, settings);
    visit("acme", "/portal/acme");
    await settle();

    const installation = trackerFor(INSTALLATION_URL)[0];
    const acme = trackerFor(ACME_URL)[0];
    expect(acme.calls.slice(0, 2)).toEqual([["requireCookieConsent"], ["disableCookies"]]);
    expect(getAnalyticsScope()).toEqual({
      installation: MATOMO,
      workspace: { slug: "acme", analytics: settings.acme.analytics, shareWithInstallation: true, name: "Acme" },
    });

    decideCookieConsent("accepted");
    await settle();
    expect(last(acme.calls)).toEqual(["rememberCookieConsentGiven"]);
    expect(installation.calls).not.toContainEqual(["rememberCookieConsentGiven"]);
    expect(installation.calls).toContainEqual(["disableCookies"]);
  });

  it("starts a workspace tracker entered after the decision with the stored consent", async () => {
    const settings: Record<string, WorkspaceAnalytics> = {
      acme: { analytics: { ...ACME, useCookies: true }, shareWithInstallation: true, name: "Acme" },
    };
    const { visit, decideCookieConsent, trackerFor } = await start({ ...MATOMO, useCookies: true }, settings);
    visit(null, "/login");
    decideCookieConsent("accepted");
    visit("acme", "/portal/acme");
    await settle();
    expect(trackerFor(ACME_URL)[0].calls.slice(0, 2)).toEqual([["requireCookieConsent"], ["setCookieConsentGiven"]]);
  });

  it("scopes the installation out of a non-sharing workspace, and lets the privacy page speak for it", async () => {
    const { visit, getAnalyticsScope, setAnalyticsContext } = await start();
    visit("private-s3cr3t", "/portal/private-s3cr3t");
    await settle();
    expect(getAnalyticsScope().installation).toBeNull();
    expect(getAnalyticsScope().workspace?.name).toBe("Private");

    setAnalyticsContext(null, "private-s3cr3t");
    await settle();
    expect(getAnalyticsScope().installation).toEqual(MATOMO);
    expect(getAnalyticsScope().workspace?.slug).toBe("private-s3cr3t");
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
