import { LOCAL_STORAGE_KEY, LocalStorage } from "@modules/app/domain/core/local-storage";

/**
 * Where a person came from before signing up, kept from their first visit to any page of the
 * installation (the cloud's landing included) until they create an account here; across visits
 * only when they accepted the cookies of the installation's banner. The backend
 * cleans it, classifies it and takes it only for a new account (SetUserSignupSource).
 */
export interface SignupSource {
  /** Origin of the referring site; same-origin navigation is not a source */
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  ref?: string;
  /** First page seen, without its query (it may carry tokens) */
  landingPath: string;
  firstSeenAt: string;
}

/** A first visit is forgotten after this long without signing up. */
export const SIGNUP_SOURCE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Whether a visit says where it came from, beyond being typed or bookmarked. */
function saysWhere(source: SignupSource): boolean {
  return !!(source.referrer || source.ref || source.utmSource || source.utmMedium || source.utmCampaign);
}

/** What this visit tells about where the person came from. */
export function sourceOfVisit(url: URL, referrer: string, now: Date): SignupSource {
  const param = (name: string) => url.searchParams.get(name)?.trim() || undefined;
  let referrerOrigin: string | undefined;
  try {
    const ref = referrer ? new URL(referrer) : null;
    if (ref && /^https?:$/.test(ref.protocol) && ref.origin !== url.origin) referrerOrigin = ref.origin;
  } catch {
    // An unreadable referrer says nothing
  }
  const source: SignupSource = { landingPath: url.pathname, firstSeenAt: now.toISOString() };
  if (referrerOrigin) source.referrer = referrerOrigin;
  const ref = param("ref");
  const utmSource = param("utm_source");
  const utmMedium = param("utm_medium");
  const utmCampaign = param("utm_campaign");
  if (ref) source.ref = ref;
  if (utmSource) source.utmSource = utmSource;
  if (utmMedium) source.utmMedium = utmMedium;
  if (utmCampaign) source.utmCampaign = utmCampaign;
  return source;
}

/**
 * The source to keep after this visit: the first one, unless it expired or only said "direct"
 * and this one says where it came from (a link shared later is the better answer).
 */
export function sourceToKeep(kept: SignupSource | null, visit: SignupSource, now: Date): SignupSource {
  if (!kept) return visit;
  const age = now.getTime() - Date.parse(kept.firstSeenAt);
  if (!(age >= 0 && age <= SIGNUP_SOURCE_TTL_MS)) return visit;
  if (!saysWhere(kept) && saysWhere(visit)) return visit;
  return kept;
}

/** This page load's source; it reaches the device only while the visitor allows it. */
let current: SignupSource | null = null;
let storageAllowed = false;

function read(): SignupSource | null {
  try {
    const raw = LocalStorage.get(LOCAL_STORAGE_KEY.SIGNUP_SOURCE);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.landingPath === "string" && typeof parsed.firstSeenAt === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function store(source: SignupSource): void {
  try {
    LocalStorage.set(LOCAL_STORAGE_KEY.SIGNUP_SOURCE, JSON.stringify(source));
  } catch {
    // Storage blocked or full: the source still goes with a signup in this visit
  }
}

function unstore(): void {
  try {
    LocalStorage.remove(LOCAL_STORAGE_KEY.SIGNUP_SOURCE);
  } catch {
    // Nothing to remove
  }
}

/**
 * Notes this page load as a visit of someone signed out; a signed-in person already has an account
 * and is not coming from anywhere. It stays in memory, for a signup in this visit, and reaches the
 * device only while the visitor allows it (allowSignupSourceStorage). Never fails.
 */
export function rememberSignupSource(now = new Date()): void {
  try {
    if (LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN)) return;
    const visit = sourceOfVisit(new URL(window.location.href), document.referrer, now);
    current = sourceToKeep(current ?? read(), visit, now);
    if (storageAllowed) store(current);
  } catch {
    // Without a source the account simply shows none
  }
}

/**
 * Whether the source may be kept on the device for later visits: only after the visitor accepted
 * the cookies of the installation's banner (ePrivacy art. 5(3)). Without it, what was kept is
 * removed from the device and the source lives only in this page load.
 */
export function allowSignupSourceStorage(allowed: boolean): void {
  storageAllowed = allowed;
  if (!allowed) {
    current = current ?? read();
    unstore();
  } else if (current) {
    store(current);
  }
}

/** The source while it is still fresh, sent with the signup or the provider sign-in. */
export function keptSignupSource(now = new Date()): SignupSource | null {
  const kept = current ?? read();
  if (!kept) return null;
  const age = now.getTime() - Date.parse(kept.firstSeenAt);
  return age >= 0 && age <= SIGNUP_SOURCE_TTL_MS ? kept : null;
}

export function forgetSignupSource(): void {
  current = null;
  unstore();
}
