import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  callbackUrl,
  canReceiveHandoff,
  createPkce,
  handoffAlreadyTried,
  offerToStore,
  readReceiveCallback,
  safeRedirect,
  startReceive,
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
