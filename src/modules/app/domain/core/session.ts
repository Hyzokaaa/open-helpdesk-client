import { LOCAL_STORAGE_KEY, LocalStorage } from "./local-storage";

export interface SessionTokens {
  accessToken: string;
  /** Omitted or null when the server did not rotate it: the stored one stays valid. */
  refreshToken?: string | null;
}

/**
 * Fired on window when this tab stores a new access token, so long-lived connections such as
 * the websocket can switch to it. Other tabs learn about it through the "storage" event.
 */
export const ACCESS_TOKEN_CHANGED_EVENT = "session:access-token-changed";

/**
 * `remember` is given when signing in: false makes the session end when the browser closes.
 * Token refreshes leave it as it was.
 */
export function saveSession(tokens: SessionTokens, options: { remember?: boolean } = {}): void {
  LocalStorage.set(LOCAL_STORAGE_KEY.ACCESS_TOKEN, tokens.accessToken);
  if (tokens.refreshToken) LocalStorage.set(LOCAL_STORAGE_KEY.REFRESH_TOKEN, tokens.refreshToken);
  if (options.remember !== undefined) LocalStorage.set(LOCAL_STORAGE_KEY.SESSION_REMEMBER, options.remember ? "1" : "0");
  markTabAlive();
  window.dispatchEvent(new Event(ACCESS_TOKEN_CHANGED_EVENT));
}

export function clearSession(): void {
  LocalStorage.remove(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
  LocalStorage.remove(LOCAL_STORAGE_KEY.REFRESH_TOKEN);
  LocalStorage.remove(LOCAL_STORAGE_KEY.SESSION_REMEMBER);
}

/*
 * A session without "Keep me signed in" must end with the browser, yet survive new tabs: the
 * tokens stay in localStorage, shared by every tab, and each open tab carries a mark in its own
 * sessionStorage, which dies with it. A tab that starts without the mark asks the others; if
 * none answers, the browser was closed in between and the session is dropped.
 */
const TAB_MARK = "ohd_tab_alive";
const CHANNEL = "ohd-session";

function markTabAlive(): void {
  try { window.sessionStorage.setItem(TAB_MARK, "1"); } catch { /* storage unavailable: nothing to keep */ }
}

function tabIsMarked(): boolean {
  try { return window.sessionStorage.getItem(TAB_MARK) === "1"; } catch { return true; }
}

/** Answers other tabs asking whether the browser is still open with this session. */
export function answerSessionPings(): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (e) => {
    if (e.data === "ping" && tabIsMarked()) channel.postMessage("pong");
  };
}

/** Run before the app renders: drops a not-remembered session left from a closed browser. */
export async function dropSessionIfBrowserWasClosed(waitMs = 250): Promise<void> {
  const remembered = LocalStorage.get(LOCAL_STORAGE_KEY.SESSION_REMEMBER) !== "0";
  if (remembered || tabIsMarked() || !LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN) || typeof BroadcastChannel === "undefined") {
    markTabAlive();
    return;
  }
  const otherTabAlive = await new Promise<boolean>((resolve) => {
    const channel = new BroadcastChannel(CHANNEL);
    const timer = window.setTimeout(() => { channel.close(); resolve(false); }, waitMs);
    channel.onmessage = (e) => {
      if (e.data !== "pong") return;
      window.clearTimeout(timer);
      channel.close();
      resolve(true);
    };
    channel.postMessage("ping");
  });
  if (!otherTabAlive) clearSession();
  markTabAlive();
}
