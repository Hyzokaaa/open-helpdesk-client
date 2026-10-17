/*
 * Session handoff between addresses of the installation (#37). The browser keeps one session per
 * address (localStorage is per origin), so a custom domain picks up the session of the
 * installation's own address through a page redirect:
 *
 *   custom domain, no session ──► installation /auth/handoff ──► custom domain /auth/handoff/callback
 *                                   has a session: code               trades the code: signed in
 *                                   none: login_required              shows its own sign-in page
 *
 * Signing in on a custom domain leaves a copy on the installation with the reverse trip
 * (/auth/handoff/store), so the next domain finds it. Each trip carries a single-use code that only
 * the receiving page can trade, with a PKCE secret it generated and keeps in its sessionStorage.
 * Only panel pages start a trip; the customer portal never does.
 */

const RECEIVE_KEY = "ohd_handoff_receive";
const STORE_KEY = "ohd_handoff_store";
const HUB_OFFER_KEY = "ohd_handoff_hub_offer";
const TRIED_KEY = "ohd_handoff_tried";

/** Where the receiving page will go once signed in, and the secrets that prove it asked. */
interface PendingReceive {
  state: string;
  verifier: string;
  redirect: string;
}

/** Kept by the installation while a custom domain signs in, to accept the session it sends back. */
interface PendingStore {
  state: string;
  verifier: string;
  returnTo: string;
}

/** Handed to a custom domain without a session, for it to send one back once signed in. */
interface HubOffer {
  challenge: string;
  state: string;
}

function read<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try { window.sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable: no handoff */ }
}

function take<T>(key: string): T | null {
  const value = read<T>(key);
  try { window.sessionStorage.removeItem(key); } catch { /* nothing to remove */ }
  return value;
}

function randomToken(bytes = 32): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return base64url(data);
}

function base64url(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** A PKCE pair: the secret kept by the receiver and its S256 challenge sent along. */
export async function createPkce(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomToken();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

function originOf(url: string | null): string | null {
  if (!url) return null;
  try { return new URL(url).origin; } catch { return null; }
}

/** The installation's own origin, from the public config. */
export function installationOrigin(appUrl: string | null): string | null {
  return originOf(appUrl);
}

/** Whether this page is served on a custom domain that can pick up the installation's session. */
export function canReceiveHandoff(appUrl: string | null, isCustomDomain: boolean): boolean {
  const installation = installationOrigin(appUrl);
  return isCustomDomain && !!installation && installation !== window.location.origin && !!window.crypto?.subtle;
}

/** One silent attempt per tab, so a domain without a session does not bounce back and forth. */
export function handoffAlreadyTried(): boolean {
  return read<boolean>(TRIED_KEY) === true;
}

export function markHandoffTried(): void {
  write(TRIED_KEY, true);
}

// ── On the custom domain ─────────────────────────────────────────────────────────────────────

/** Leaves for the installation to pick up its session; it comes back to /auth/handoff/callback. */
export async function startReceive(appUrl: string, redirect: string): Promise<void> {
  const installation = installationOrigin(appUrl)!;
  const { verifier, challenge } = await createPkce();
  const state = randomToken(16);
  write(RECEIVE_KEY, { state, verifier, redirect } satisfies PendingReceive);
  markHandoffTried();
  const params = new URLSearchParams({ return: window.location.origin, challenge, state });
  window.location.assign(`${installation}/auth/handoff?${params}`);
}

export type ReceiveResult =
  | { kind: "code"; code: string; verifier: string; redirect: string }
  | { kind: "login"; redirect: string }
  | { kind: "invalid" };

/** Reads what the installation sent back; the callback URL must match the trip this tab started. */
export function readReceiveCallback(params: URLSearchParams): ReceiveResult {
  const pending = take<PendingReceive>(RECEIVE_KEY);
  if (!pending || params.get("state") !== pending.state) return { kind: "invalid" };

  const code = params.get("code");
  if (code) return { kind: "code", code, verifier: pending.verifier, redirect: pending.redirect };

  const hubChallenge = params.get("hubChallenge");
  const hubState = params.get("hubState");
  if (hubChallenge && hubState) write(HUB_OFFER_KEY, { challenge: hubChallenge, state: hubState } satisfies HubOffer);
  return { kind: "login", redirect: pending.redirect };
}

/**
 * After signing in on the custom domain: the installation's offer, if it made one in this tab,
 * so the session can be sent back to it. Used once.
 */
export function takeHubOffer(): HubOffer | null {
  return take<HubOffer>(HUB_OFFER_KEY);
}

/** Leaves for the installation with a code for it; it stores the session and comes back. */
export function goStoreOnInstallation(appUrl: string, code: string, offer: HubOffer, redirect: string): void {
  const installation = installationOrigin(appUrl)!;
  const params = new URLSearchParams({ code, state: offer.state, return: window.location.origin, redirect });
  window.location.assign(`${installation}/auth/handoff/store?${params}`);
}

// ── On the installation ──────────────────────────────────────────────────────────────────────

/** Prepares to receive the session a custom domain will send back once its user signs in. */
export async function offerToStore(returnTo: string): Promise<HubOffer> {
  const { verifier, challenge } = await createPkce();
  const state = randomToken(16);
  write(STORE_KEY, { state, verifier, returnTo } satisfies PendingStore);
  return { challenge, state };
}

/** The secret for a session sent back by a custom domain, if this tab offered to store one. */
export function takeStoreOffer(state: string | null, returnTo: string | null): PendingStore | null {
  const pending = take<PendingStore>(STORE_KEY);
  if (!pending || pending.state !== state || pending.returnTo !== returnTo) return null;
  return pending;
}

/** The custom domain's page to go back to, built from its origin and a fixed path. */
export function callbackUrl(returnTo: string, params: Record<string, string>): string {
  return `${returnTo}/auth/handoff/callback?${new URLSearchParams(params)}`;
}

/** A path on the custom domain to land on after the trip; only same-site paths. */
export function safeRedirect(path: string | null): string {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}
