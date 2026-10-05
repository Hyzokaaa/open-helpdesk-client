import { useCallback, useState } from "react";

const STORAGE_KEY = "api_docs_try_key";

function read(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * The API key typed in the "Try it" panel, kept in this browser's localStorage so it survives
 * navigation between operations. Storage may be unavailable (private mode, blocked site data):
 * the key then lives in memory only.
 */
export default function useStoredApiKey(): [string, (key: string) => void] {
  const [key, setKey] = useState(read);

  const update = useCallback((next: string) => {
    setKey(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, next);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Memory only
    }
  }, []);

  return [key, update];
}
