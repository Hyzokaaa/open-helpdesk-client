export enum LOCAL_STORAGE_KEY {
  ACCESS_TOKEN = "access_token",
  REFRESH_TOKEN = "refresh_token",
  /** "Keep me signed in" chosen before an OAuth popup, read back by the callback page. */
  OAUTH_REMEMBER_ME = "oauth_remember_me",
  LANGUAGE = "language",
  /** "0" when this session should end with the browser; absent or "1" when it is remembered. */
  SESSION_REMEMBER = "session_remember",
  /** The last "Keep me signed in" choice, so the sign-in page offers it again. */
  LOGIN_REMEMBER_CHOICE = "login_remember_choice",
}

export class LocalStorage {
  static get(key: string): string | null {
    return window.localStorage.getItem(key);
  }

  static set(key: string, value: string): void {
    window.localStorage.setItem(key, value);
  }

  static remove(key: string): void {
    window.localStorage.removeItem(key);
  }
}
