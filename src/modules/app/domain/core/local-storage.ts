export enum LOCAL_STORAGE_KEY {
  ACCESS_TOKEN = "access_token",
  REFRESH_TOKEN = "refresh_token",
  /** "Keep me signed in" chosen before an OAuth popup, read back by the callback page. */
  OAUTH_REMEMBER_ME = "oauth_remember_me",
  LANGUAGE = "language",
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
