import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SIGNUP_SOURCE_TTL_MS,
  sourceOfVisit,
  sourceToKeep,
  type SignupSource,
} from "./signup-source";

const now = new Date("2026-10-25T12:00:00.000Z");
const later = (ms: number) => new Date(now.getTime() + ms);

describe("sourceOfVisit", () => {
  it("keeps the external referrer as its origin, and the page without its query", () => {
    const visit = sourceOfVisit(new URL("https://openhelpdesk.dev/pricing?token=secret"), "https://www.reddit.com/r/selfhosted/comments/x", now);
    expect(visit).toEqual({ referrer: "https://www.reddit.com", landingPath: "/pricing", firstSeenAt: now.toISOString() });
  });

  it("reads ?ref= and the utm tags", () => {
    const visit = sourceOfVisit(new URL("https://openhelpdesk.dev/?ref=reddit&utm_source=r&utm_medium=post&utm_campaign=launch"), "", now);
    expect(visit).toMatchObject({ ref: "reddit", utmSource: "r", utmMedium: "post", utmCampaign: "launch" });
    expect(visit.referrer).toBeUndefined();
  });

  it("does not count navigation inside the installation, or a referrer that is not a web page", () => {
    expect(sourceOfVisit(new URL("https://openhelpdesk.dev/signup"), "https://openhelpdesk.dev/pricing", now).referrer).toBeUndefined();
    expect(sourceOfVisit(new URL("https://openhelpdesk.dev/"), "android-app://com.reddit", now).referrer).toBeUndefined();
    expect(sourceOfVisit(new URL("https://openhelpdesk.dev/"), "not a url", now).referrer).toBeUndefined();
  });
});

describe("sourceToKeep", () => {
  const direct: SignupSource = { landingPath: "/", firstSeenAt: now.toISOString() };
  const reddit: SignupSource = { referrer: "https://reddit.com", landingPath: "/", firstSeenAt: now.toISOString() };

  it("keeps the first visit that says where it came from", () => {
    const google = sourceOfVisit(new URL("https://openhelpdesk.dev/"), "https://google.com/", later(1000));
    expect(sourceToKeep(reddit, google, later(1000))).toBe(reddit);
  });

  it("replaces a direct visit with a later one that says where it came from, but not the other way round", () => {
    expect(sourceToKeep(direct, reddit, later(1000))).toBe(reddit);
    const directAgain = { ...direct, firstSeenAt: later(1000).toISOString() };
    expect(sourceToKeep(reddit, directAgain, later(1000))).toBe(reddit);
  });

  it("starts again once the first visit expired", () => {
    const visit = { ...direct, firstSeenAt: later(SIGNUP_SOURCE_TTL_MS + 1).toISOString() };
    expect(sourceToKeep(reddit, visit, later(SIGNUP_SOURCE_TTL_MS + 1))).toBe(visit);
  });
});

/** A browser tab at a URL, with its own storage and referrer. */
function fakeTab(href: string, referrer = "", store = new Map<string, string>()) {
  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  vi.stubGlobal("window", { location: { href }, localStorage });
  vi.stubGlobal("document", { referrer });
  return store;
}

/** A new page load: the module starts over, the device keeps what was stored. */
async function pageLoad(href: string, store?: Map<string, string>, referrer = "") {
  const device = fakeTab(href, referrer, store);
  vi.resetModules();
  return { device, ...(await import("./signup-source")) };
}

describe("rememberSignupSource / keptSignupSource", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the visit of someone signed out until it is forgotten", async () => {
    const page = await pageLoad("https://openhelpdesk.dev/pricing?ref=reddit");
    page.rememberSignupSource(now);
    expect(page.keptSignupSource(now)).toMatchObject({ ref: "reddit", landingPath: "/pricing" });
    page.forgetSignupSource();
    expect(page.keptSignupSource(now)).toBeNull();
  });

  it("notes nothing for someone signed in", async () => {
    const page = await pageLoad("https://openhelpdesk.dev/pricing?ref=reddit", new Map([["access_token", "token"]]));
    page.rememberSignupSource(now);
    expect(page.keptSignupSource(now)).toBeNull();
  });

  it("does not hand over an expired or damaged source", async () => {
    let page = await pageLoad("https://openhelpdesk.dev/pricing?ref=reddit");
    page.rememberSignupSource(now);
    expect(page.keptSignupSource(later(SIGNUP_SOURCE_TTL_MS + 1))).toBeNull();

    page = await pageLoad("https://openhelpdesk.dev/", new Map([["signup_source", "{not json"]]));
    expect(page.keptSignupSource(now)).toBeNull();
  });

  it("without the visitor's consent keeps the source only in this page load, never on the device", async () => {
    const page = await pageLoad("https://openhelpdesk.dev/pricing?ref=reddit");
    page.rememberSignupSource(now);
    page.allowSignupSourceStorage(false);

    expect(page.keptSignupSource(now)).toMatchObject({ ref: "reddit" });
    expect(page.device.has("signup_source")).toBe(false);

    const next = await pageLoad("https://openhelpdesk.dev/signup", page.device);
    next.rememberSignupSource(later(1000));
    expect(next.keptSignupSource(later(1000))).toMatchObject({ landingPath: "/signup" });
    expect(next.keptSignupSource(later(1000))?.ref).toBeUndefined();
  });

  it("with consent, keeps the first visit on the device for a signup on a later visit", async () => {
    const page = await pageLoad("https://openhelpdesk.dev/pricing?ref=reddit");
    page.rememberSignupSource(now);
    expect(page.device.has("signup_source")).toBe(false);
    page.allowSignupSourceStorage(true);
    expect(page.device.has("signup_source")).toBe(true);

    const next = await pageLoad("https://openhelpdesk.dev/signup", page.device);
    next.rememberSignupSource(later(1000));
    expect(next.keptSignupSource(later(1000))).toMatchObject({ ref: "reddit", landingPath: "/pricing" });
  });

  it("removes the source from the device when the visitor rejects the cookies, and keeps it for this page load", async () => {
    const page = await pageLoad("https://openhelpdesk.dev/pricing?ref=reddit");
    page.allowSignupSourceStorage(true);
    page.rememberSignupSource(now);
    expect(page.device.has("signup_source")).toBe(true);

    page.allowSignupSourceStorage(false);
    expect(page.device.has("signup_source")).toBe(false);
    expect(page.keptSignupSource(now)).toMatchObject({ ref: "reddit" });

    page.rememberSignupSource(later(1000));
    expect(page.device.has("signup_source")).toBe(false);
  });
});
