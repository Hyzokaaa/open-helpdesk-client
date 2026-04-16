export enum LOCAL_STORAGE_KEY {
  ACCESS_TOKEN = "access_token",
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
