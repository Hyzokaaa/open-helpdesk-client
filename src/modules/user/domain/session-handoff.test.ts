import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  callbackUrl,
  canReceiveHandoff,
  createPkce,
  domainTakesSessions,
  HANDOFF_RETRY_AFTER_MS,
  handoffAlreadyTried,
  handoffFailure,
  markHandoffTried,
  offerToStore,
  readReceiveCallback,
  safeRedirect,
  signInPathFor,
  startReceive,
  startStoreAfterSignIn,
  takeHubOffer,
  takeStoreOffer,
} from "./session-handoff";

/** One tab of a browser on `origin`: its own sessionStorage and the page it navigates to. */
function fakeTab(origin: string) {
  const store = new Map<string, string>();
  const tab = {
    navigatedTo: null as string | null,
    window: {
      location: { origin, assign: (url: string) => { tab.navigatedTo = url; } },
      sessionStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, v); },
        removeItem: (k: string) => { store.delete(k); },
      },
      crypto: globalThis.crypto,
    },
  };
  vi.stubGlobal("window", tab.window);
  return tab;
}

const APP = "https://app.helpdesk.test";
const ACME = "https://soporte.acme.test";

describe("session handoff in the browser", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("only starts on a custom domain other than the installation's own address", () => {
    fakeTab(ACME);
    expect(canReceiveHandoff(APP, true)).toBe(true);
    expect(canReceiveHandoff(APP, false)).toBe(false);
    expect(canReceiveHandoff(null, true)).toBe(false);

    fakeTab(APP);
    expect(canReceiveHandoff(APP, true)).toBe(false);
  });

  it("makes a PKCE pair whose challenge is the S256 of the secret", async () => {
    const { verifier, challenge } = await createPkce();
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    // Computed here with the browser APIs only, as the page does: the client has no Node types
    const expected = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(challenge).toBe(expected);
  });

  it("goes to the installation once per tab and accepts only its own trip back", async () => {
    const tab = fakeTab(ACME);
    await startReceive(APP, "/dashboard/workspaces/acme");

    const url = new URL(tab.navigatedTo!);
    expect(url.origin + url.pathname).toBe(`${APP}/auth/handoff`);
    expect(url.searchParams.get("return")).toBe(ACME);
    expect(handoffAlreadyTried()).toBe(true);

    expect(readReceiveCallback(new URLSearchParams({ code: "c", state: "forged" }))).toEqual({ kind: "invalid" });
  });

  it("holds off another trip only for a moment, so a session started meanwhile is picked up later", () => {
    const tab = fakeTab(ACME);
    const t0 = 1_000_000;
    expect(handoffAlreadyTried(t0)).toBe(false);

    markHandoffTried(t0);
    expect(handoffAlreadyTried(t0 + 1)).toBe(true);
    expect(handoffAlreadyTried(t0 + HANDOFF_RETRY_AFTER_MS - 1)).toBe(true);
    expect(handoffAlreadyTried(t0 + HANDOFF_RETRY_AFTER_MS)).toBe(false);
    // A clock that went back does not hold it off for ever
    expect(handoffAlreadyTried(t0 - 1)).toBe(false);

    // The mark earlier versions left for ever no longer blocks the tab
    tab.window.sessionStorage.setItem("ohd_handoff_tried", "true");
    expect(handoffAlreadyTried(t0)).toBe(false);
  });

  it("comes back to a plain sign-in page when the trip was for the panel's home", () => {
    expect(signInPathFor("/dashboard")).toBe("/login");
    expect(signInPathFor(null)).toBe("/login");
    expect(signInPathFor("/dashboard/portal/acme")).toBe("/login?redirect=%2Fdashboard%2Fportal%2Facme");
  });

  it("returns the code with the secret that trades it", async () => {
    const tab = fakeTab(ACME);
    await startReceive(APP, "/dashboard");
    const state = new URL(tab.navigatedTo!).searchParams.get("state")!;

    const result = readReceiveCallback(new URLSearchParams({ code: "the-code", state }));

    expect(result).toMatchObject({ kind: "code", code: "the-code", redirect: "/dashboard" });
  });

  it("keeps the installation's offer to store the session after signing in", async () => {
    const tab = fakeTab(ACME);
    await startReceive(APP, "/dashboard");
    const state = new URL(tab.navigatedTo!).searchParams.get("state")!;

    const result = readReceiveCallback(new URLSearchParams({ error: "login_required", state, hubChallenge: "hc", hubState: "hs" }));

    expect(result).toEqual({ kind: "login", redirect: "/dashboard" });
    expect(takeHubOffer()).toEqual({ challenge: "hc", state: "hs" });
    expect(takeHubOffer()).toBeNull();
  });

  it("after signing in with no offer, goes to fetch one and comes back to send the session there", async () => {
    const tab = fakeTab(ACME);
    await startStoreAfterSignIn(APP, "/dashboard/workspaces/acme");

    const url = new URL(tab.navigatedTo!);
    expect(url.origin + url.pathname).toBe(`${APP}/auth/handoff`);
    expect(url.searchParams.get("want")).toBe("store");
    expect(url.searchParams.get("return")).toBe(ACME);
    const state = url.searchParams.get("state")!;

    const result = readReceiveCallback(new URLSearchParams({ error: "login_required", state, hubChallenge: "hc", hubState: "hs" }));
    expect(result).toEqual({ kind: "store", redirect: "/dashboard/workspaces/acme", installation: APP, offer: { challenge: "hc", state: "hs" } });
  });

  it("after signing in, an installation that already has a session makes no offer, and the domain goes on", async () => {
    const tab = fakeTab(ACME);
    await startStoreAfterSignIn(APP, "/dashboard");
    const state = new URL(tab.navigatedTo!).searchParams.get("state")!;

    expect(readReceiveCallback(new URLSearchParams({ error: "has_session", state })))
      .toEqual({ kind: "store", redirect: "/dashboard", installation: APP, offer: null });
    expect(readReceiveCallback(new URLSearchParams({ error: "has_session", state }))).toEqual({ kind: "invalid" });
  });

  it("only a domain the server still trusts takes sessions; older servers do not say, and it does", () => {
    expect(domainTakesSessions(null)).toBe(false);
    expect(domainTakesSessions([{ sessionHandoff: false }])).toBe(false);
    expect(domainTakesSessions([{ sessionHandoff: true }])).toBe(true);
    expect(domainTakesSessions([{}])).toBe(true);
    expect(domainTakesSessions([{ sessionHandoff: false }, { sessionHandoff: true }])).toBe(true);
  });

  it("without a session there, comes back to the sign-in page it was given, and only to a sign-in page", async () => {
    let tab = fakeTab(ACME);
    const signIn = "/login?from=portal&portal=acme&redirect=%2Fdashboard%2Fportal%2Facme";
    await startReceive(APP, "/dashboard/portal/acme", signIn);
    let state = new URL(tab.navigatedTo!).searchParams.get("state")!;
    expect(readReceiveCallback(new URLSearchParams({ error: "login_required", state }))).toEqual({ kind: "login", redirect: "/dashboard/portal/acme", signIn });

    tab = fakeTab(ACME);
    await startReceive(APP, "/dashboard", "https://elsewhere.example/login");
    state = new URL(tab.navigatedTo!).searchParams.get("state")!;
    expect(readReceiveCallback(new URLSearchParams({ error: "login_required", state }))).toEqual({ kind: "login", redirect: "/dashboard" });
  });

  it("on the installation, takes back only the session this tab offered to keep", async () => {
    fakeTab(APP);
    const offer = await offerToStore(ACME);

    expect(takeStoreOffer("other-state", ACME)).toBeNull();
    const again = await offerToStore(ACME);
    expect(takeStoreOffer(again.state, "https://evil.test")).toBeNull();
    const third = await offerToStore(ACME);
    expect(takeStoreOffer(third.state, ACME)).toMatchObject({ returnTo: ACME });
    expect(offer.challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("builds the way back from the origin and a fixed path, and lands only on local paths", () => {
    expect(callbackUrl(ACME, { code: "c", state: "s" })).toBe(`${ACME}/auth/handoff/callback?code=c&state=s`);
    expect(safeRedirect("/dashboard/x")).toBe("/dashboard/x");
    expect(safeRedirect("//evil.test")).toBe("/dashboard");
    expect(safeRedirect("https://evil.test")).toBe("/dashboard");
    expect(safeRedirect(null)).toBe("/dashboard");
  });
});

describe("handoffFailure", () => {
  const withStatus = (status: number) => Object.assign(new Error(`Request failed with status code ${status}`), { response: { status } });

  it("says the address is not the installation's only when the server answers 400", () => {
    expect(handoffFailure(withStatus(400))).toBe("refused");
  });

  it.each([429, 500, 502, 503, 504])("reads a %i as the installation not answering", (status) => {
    expect(handoffFailure(withStatus(status))).toBe("unreachable");
  });

  it("reads a network error, without a response, as the installation not answering", () => {
    expect(handoffFailure(new Error("Network Error"))).toBe("unreachable");
    expect(handoffFailure(undefined)).toBe("unreachable");
    expect(handoffFailure(null)).toBe("unreachable");
  });
});
