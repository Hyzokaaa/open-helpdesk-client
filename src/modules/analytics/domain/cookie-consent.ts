/** The visitor's answer to the analytics cookie banner. */
export type CookieConsent = "accepted" | "rejected";

const STORAGE_KEY = "analytics_cookie_consent";

/** The stored decision, or null when the visitor has not answered (or storage is unavailable). */
export function readCookieConsent(): CookieConsent | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

/** Stores the decision; when storage is blocked the banner simply asks again next visit. */
export function writeCookieConsent(consent: CookieConsent): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, consent);
  } catch {
    // Private mode or blocked storage: the decision still applies to this page load.
  }
}

/** Whether the banner is open: on first visit, or reopened from "Cookie preferences". */
interface ConsentUiState {
  consent: CookieConsent | null;
  preferencesOpen: boolean;
}

type Listener = () => void;

const listeners = new Set<Listener>();
let state: ConsentUiState | null = null;

function current(): ConsentUiState {
  if (!state) state = { consent: readCookieConsent(), preferencesOpen: false };
  return state;
}

function update(next: Partial<ConsentUiState>): void {
  state = { ...current(), ...next };
  listeners.forEach((listener) => listener());
}

export function subscribeCookieConsent(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCookieConsentState(): ConsentUiState {
  return current();
}

/** Records a decision and closes the banner. The caller applies it to the provider. */
export function setCookieConsentDecision(consent: CookieConsent): void {
  writeCookieConsent(consent);
  update({ consent, preferencesOpen: false });
}

/** Reopens the banner so the visitor can change an earlier decision. */
export function openCookiePreferences(): void {
  update({ preferencesOpen: true });
}
