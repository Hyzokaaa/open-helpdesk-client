import { LOCAL_STORAGE_KEY, LocalStorage } from "./local-storage";

export interface SessionTokens {
  accessToken: string;
  /** Omitted or null when the server did not rotate it: the stored one stays valid. */
  refreshToken?: string | null;
}

export function saveSession(tokens: SessionTokens): void {
  LocalStorage.set(LOCAL_STORAGE_KEY.ACCESS_TOKEN, tokens.accessToken);
  if (tokens.refreshToken) LocalStorage.set(LOCAL_STORAGE_KEY.REFRESH_TOKEN, tokens.refreshToken);
}

export function clearSession(): void {
  LocalStorage.remove(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
  LocalStorage.remove(LOCAL_STORAGE_KEY.REFRESH_TOKEN);
}
