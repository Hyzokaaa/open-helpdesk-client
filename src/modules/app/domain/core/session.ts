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

export function saveSession(tokens: SessionTokens): void {
  LocalStorage.set(LOCAL_STORAGE_KEY.ACCESS_TOKEN, tokens.accessToken);
  if (tokens.refreshToken) LocalStorage.set(LOCAL_STORAGE_KEY.REFRESH_TOKEN, tokens.refreshToken);
  window.dispatchEvent(new Event(ACCESS_TOKEN_CHANGED_EVENT));
}

export function clearSession(): void {
  LocalStorage.remove(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
  LocalStorage.remove(LOCAL_STORAGE_KEY.REFRESH_TOKEN);
}
