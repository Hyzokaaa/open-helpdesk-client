import type { AnalyticsAdapter } from "../adapters/analytics-adapter";
import { MatomoAdapter } from "../adapters/matomo-adapter";
import { needsCookieConsent, type AnalyticsConfig } from "./analytics-config";
import { readCookieConsent, setCookieConsentDecision, type CookieConsent } from "./cookie-consent";
import { serializeEventProps, type AnalyticsEventArgs, type AnalyticsEventName } from "./events";
import { resolveAnalyticsRoute } from "./route-catalogue";

/**
 * The analytics runtime. A page can report to two destinations:
 *
 * - the installation's tracker (system setting), started by `AnalyticsTracker` once the public
 *   config arrives: every page and event, except those in the context of a workspace that
 *   turned "Share usage with Open Helpdesk" off;
 * - the current workspace's own tracker (the customer's Matomo), when it configured one: only
 *   the pages and events in that workspace's context, never anything outside it.
 *
 * Both receive the same pattern URL, fixed title and sanitised referrer. Everything here is a
 * no-op until started, and stays one when no destination is on, so callers can report events
 * without checking anything. Analytics never throws into the code that calls it.
 */

/** A workspace's analytics as its public endpoint reports it, plus its name for visitors. */
export interface WorkspaceAnalytics {
  analytics: AnalyticsConfig | null;
  shareWithInstallation: boolean;
  /** For the consent banner and privacy policy; null when not known ("this organisation"). */
  name: string | null;
}

export type WorkspaceAnalyticsLoader = (slug: string) => Promise<WorkspaceAnalytics>;

/** What measures the current page, for the consent banner, the preferences link and the privacy policy. */
export interface AnalyticsScope {
  /** The installation's config when it measures the current page, else null. */
  installation: AnalyticsConfig | null;
  /** The workspace the page (or the privacy policy) is about, with its own analytics, if any. */
  workspace: ({ slug: string } & WorkspaceAnalytics) | null;
}

interface Destination {
  adapter: AnalyticsAdapter;
  config: AnalyticsConfig;
  /** The last page URL this destination received: its next referrer. */
  lastUrl: string | null;
}

interface WorkspaceEntry {
  slug: string;
  info: WorkspaceAnalytics;
  destination: Destination | null;
}

/** When a workspace's settings cannot be read: no tracker of its own, and nothing shared on its behalf. */
const UNREADABLE: WorkspaceAnalytics = { analytics: null, shareWithInstallation: false, name: null };
const EMPTY_SCOPE: AnalyticsScope = { installation: null, workspace: null };

let started = false;
let installation: Destination | null = null;
let loader: WorkspaceAnalyticsLoader | null = null;
const workspaces = new Map<string, Promise<WorkspaceEntry>>();
/** The workspace whose context the current page is in (tracking), resolved in queue order. */
let current: WorkspaceEntry | null = null;
let lastPathname: string | null = null;
let pageCount = 0;

/**
 * Context switches, page views and events run through one queue, so a hit is always routed by
 * the context of the page it happened on, even while a workspace's settings are still loading.
 */
let queue: Promise<void> = Promise.resolve();

function enqueue(task: () => void | Promise<void>): void {
  queue = queue.then(task).catch(() => undefined);
}

let scope: AnalyticsScope = EMPTY_SCOPE;
const listeners = new Set<() => void>();

function setScope(next: AnalyticsScope): void {
  scope = next;
  listeners.forEach((listener) => listener());
}

export function subscribeAnalyticsScope(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAnalyticsScope(): AnalyticsScope {
  return scope;
}

function createAdapter(value: AnalyticsConfig): AnalyticsAdapter {
  switch (value.provider) {
    case "matomo":
      return new MatomoAdapter(value);
  }
}

function createDestination(config: AnalyticsConfig): Destination | null {
  try {
    const adapter = createAdapter(config);
    adapter.init(needsCookieConsent(config) ? readCookieConsent() : null);
    return { adapter, config, lastUrl: null };
  } catch {
    return null;
  }
}

/**
 * Starts the runtime with the installation's analytics (null when the installation has it
 * off; workspaces can still have their own). Later calls are ignored: a settings change applies
 * on the next page load.
 */
export function startAnalytics(value: AnalyticsConfig | null): void {
  if (started) return;
  started = true;
  installation = value ? createDestination(value) : null;
  setScope({ ...scope, installation: installation && sharesWithInstallation(current) ? installation.config : null });
}

/** How the runtime reads a workspace's public analytics settings (set by `AnalyticsTracker`). */
export function setWorkspaceAnalyticsLoader(value: WorkspaceAnalyticsLoader): void {
  loader = value;
}

/** A workspace's settings, read once per page load and slug. */
function workspaceEntry(slug: string): Promise<WorkspaceEntry> {
  const cached = workspaces.get(slug);
  if (cached) return cached;
  const load = loader;
  const entry = (load ? load(slug).catch(() => UNREADABLE) : Promise.resolve(UNREADABLE))
    .then((info): WorkspaceEntry => ({ slug, info, destination: null }));
  workspaces.set(slug, entry);
  return entry;
}

/** The public settings of a workspace (cached), e.g. for the privacy policy. */
export function getWorkspaceAnalytics(slug: string): Promise<WorkspaceAnalytics> {
  return workspaceEntry(slug).then((entry) => entry.info);
}

function sharesWithInstallation(entry: WorkspaceEntry | null): boolean {
  return !entry || entry.info.shareWithInstallation;
}

/**
 * The workspace the visitor is in, or null outside any workspace. `scopeSlug` is the workspace
 * the consent banner and the privacy policy speak for, which differs only on the privacy page
 * (it describes the workspace the visitor came from, without tracking the page as its own).
 * Leaving a workspace pauses its tracker; returning reuses it.
 */
export function setAnalyticsContext(trackingSlug: string | null, scopeSlug: string | null = trackingSlug): void {
  enqueue(async () => {
    const next = trackingSlug ? await workspaceEntry(trackingSlug) : null;
    const about = scopeSlug ? (scopeSlug === trackingSlug ? next : await workspaceEntry(scopeSlug)) : null;

    if (current && current !== next) current.destination?.adapter.pause();
    if (next && !next.destination && next.info.analytics) next.destination = createDestination(next.info.analytics);
    current = next;

    setScope({
      installation: installation && sharesWithInstallation(next) ? installation.config : null,
      workspace: about ? { slug: about.slug, ...about.info } : null,
    });
  });
}

/**
 * The referrer of the first page view. A same-origin referrer is reduced to its route pattern
 * (a full reload from `/verify-email?token=...` must not leak the token); an external one to
 * its origin.
 */
function initialReferrer(): string {
  try {
    if (!document.referrer) return "";
    const ref = new URL(document.referrer);
    if (ref.origin === window.location.origin) return ref.origin + resolveAnalyticsRoute(ref.pathname).pattern;
    return `${ref.origin}/`;
  } catch {
    return "";
  }
}

/** The page's targets: the installation unless the workspace keeps its usage to itself, and the workspace's own. */
function destinations(): Destination[] {
  const targets: Destination[] = [];
  if (installation && sharesWithInstallation(current)) targets.push(installation);
  if (current?.destination) targets.push(current.destination);
  return targets;
}

/**
 * Reports a page view for a pathname as its route pattern. The same pathname twice in a row is
 * reported once, which also absorbs React StrictMode's double effects. Each destination gets
 * the previous page it received as referrer, so it never learns about pages it did not get.
 */
export function trackPage(pathname: string): void {
  if (!started || pathname === lastPathname) return;
  try {
    const route = resolveAnalyticsRoute(pathname);
    const url = window.location.origin + route.pattern;
    const first = pageCount === 0;
    lastPathname = pathname;
    pageCount += 1;
    enqueue(() => {
      const fallback = first ? initialReferrer() : "";
      for (const target of destinations()) {
        try {
          target.adapter.trackPageView({ url, title: route.title, referrer: target.lastUrl ?? fallback });
          target.lastUrl = url;
        } catch {
          // One destination failing never blocks the other.
        }
      }
    });
  } catch {
    // Analytics must never break navigation.
  }
}

/**
 * Reports a product event after an action succeeded, to every destination of the current page
 * whose operator enabled product events. Props are enum-like values only (see `events.ts`).
 */
export function trackEvent<E extends AnalyticsEventName>(name: E, ...args: AnalyticsEventArgs<E>): void {
  if (!started) return;
  try {
    const props = serializeEventProps(args[0] as Record<string, string> | undefined);
    enqueue(() => {
      for (const target of destinations()) {
        if (!target.config.trackEvents) continue;
        try {
          target.adapter.trackEvent(name, props);
        } catch {
          // One destination failing never blocks the other.
        }
      }
    });
  } catch {
    // Analytics must never break the action that reported it.
  }
}

/**
 * Stores the visitor's banner decision (one decision for the page) and applies it to every
 * tracker that uses cookies; trackers without cookies ignore it and stay cookieless.
 */
export function decideCookieConsent(consent: CookieConsent): void {
  setCookieConsentDecision(consent);
  const apply = (target: Destination | null) => {
    try {
      if (target && needsCookieConsent(target.config)) target.adapter.applyConsent(consent);
    } catch {
      // The stored decision still applies from the next page load.
    }
  };
  apply(installation);
  for (const pending of workspaces.values()) pending.then((entry) => apply(entry.destination), () => undefined);
}
