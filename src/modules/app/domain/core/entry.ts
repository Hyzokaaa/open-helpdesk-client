import { portalAccessOf, portalSignInPath, type PortalAccess } from "@modules/portal/domain/portal-access";
import { safeRedirect, signInPathFor } from "@modules/user/domain/session-handoff";

/*
 * Where each way into the app leads: the panel, the customer portal, the sign-in page, or a trip
 * to the installation's address for its session (#37). Kept as plain functions of what the page
 * knows, so every combination is tested in one place (entry.test.ts); the components only follow.
 */

/** What the page knows about the session, on this address and on the installation's. */
export interface SessionState {
  /** A session is kept on this address */
  hasSession: boolean;
  /** This is a custom domain that can pick up the installation's session */
  canHandoff: boolean;
  /** This tab went for it a moment ago (session-handoff: HANDOFF_RETRY_AFTER_MS) */
  handoffTriedRecently: boolean;
}

/** A workspace served on this custom domain, as the domain resolution describes it */
export interface DomainWorkspaceAccess extends Partial<PortalAccess> {
  slug: string;
}

// ── Panel pages ──────────────────────────────────────────────────────────────────────────────

export type PanelEntry =
  | { kind: "enter" }
  | { kind: "handoff"; redirect: string }
  | { kind: "navigate"; to: string };

/** A page of the panel (/dashboard…): needs a session, here or picked up from the installation. */
export function panelEntry(state: SessionState & { signedOutHere: boolean; path: string }): PanelEntry {
  if (state.hasSession) return { kind: "enter" };
  if (state.canHandoff && !state.handoffTriedRecently) return { kind: "handoff", redirect: state.path };
  return { kind: "navigate", to: panelSignInPath(state.signedOutHere, state.path) };
}

/** Someone who just signed out goes to a plain sign-in page; anyone else comes back once signed in */
export function panelSignInPath(signedOutHere: boolean, path: string): string {
  return signedOutHere ? "/login" : signInPathFor(path);
}

// ── The sign-in page ─────────────────────────────────────────────────────────────────────────

/** Sent to sign in by a closed portal: the page speaks to customers, and leads to the panel. */
export function isClosedPortalSignIn(search: URLSearchParams, domainWorkspaces: DomainWorkspaceAccess[] | null): boolean {
  if (search.get("from") !== "portal") return false;
  const everyPortalClosed = !!domainWorkspaces?.length && domainWorkspaces.every((w) => !portalAccessOf(w).portalEnabled);
  return !!search.get("portal") || search.get("notice") === "portal-link" || everyPortalClosed;
}

export type SignInEntry =
  | { kind: "form" }
  | { kind: "go"; redirect: string | null }
  | { kind: "handoff"; redirect: string; signIn?: string };

/**
 * The sign-in page on arrival. A closed portal leads to the panel: whoever is signed in here goes
 * straight on, and a custom domain first looks for the installation's session, coming back to
 * this same page without one. An open portal's sign-in never leaves this domain (#37); nor does
 * a sign-in after an expiry, which ended that session too.
 */
export function signInEntry(state: SessionState & { search: URLSearchParams; closedPortal: boolean; currentUrl: string }): SignInEntry {
  const { search, closedPortal } = state;
  if (closedPortal && state.hasSession) return { kind: "go", redirect: search.get("redirect") };
  if (!state.canHandoff || state.handoffTriedRecently || search.get("expired") === "1") return { kind: "form" };
  if (search.get("from") === "portal" && !closedPortal) return { kind: "form" };
  return {
    kind: "handoff",
    redirect: safeRedirect(search.get("redirect")),
    ...(closedPortal && { signIn: state.currentUrl }),
  };
}

// ── The root of the app ──────────────────────────────────────────────────────────────────────

export type RootEntry = { kind: "navigate"; to: string } | { kind: "portal-selector" };

/**
 * "/": on a custom domain, its portal while open (the selector, with several). With every portal
 * closed, and elsewhere, the root is the panel's: the panel with a session, else a plain sign-in
 * page, which on a custom domain first looks for the installation's session. Only /portal speaks
 * of the closed portal.
 */
export function rootEntry(domainWorkspaces: DomainWorkspaceAccess[] | null, hasSession: boolean): RootEntry {
  const open = domainWorkspaces?.filter((w) => portalAccessOf(w).portalEnabled) ?? [];
  if (domainWorkspaces?.length === 1 && open.length === 1) return { kind: "navigate", to: "/portal" };
  if (open.length > 0) return { kind: "portal-selector" };
  // A session that turns out to be expired is sent back to sign in by the panel itself
  return { kind: "navigate", to: hasSession ? "/dashboard" : "/login" };
}

// ── Customer portal pages ────────────────────────────────────────────────────────────────────

export type PortalEntry = { kind: "enter" } | { kind: "loading" } | { kind: "navigate"; to: string };

/**
 * A page of the customer portal (/portal…). The knowledge base has its own switch: a private one
 * leads to the portal, or to sign-in if the portal is closed too; the portal itself, when closed,
 * leads to sign-in.
 */
export function portalEntry(state: {
  domainWorkspaces: DomainWorkspaceAccess[] | null;
  /** The workspace named in the address, if any */
  routeSlug?: string;
  /** The workspace the portal is for: the address's, or the custom domain's only one */
  slug?: string;
  basePath: string;
  pathname: string;
  access: PortalAccess | null;
}): PortalEntry {
  const { domainWorkspaces, routeSlug, slug, basePath, pathname, access } = state;
  // A custom domain only serves its own workspaces
  if (domainWorkspaces && routeSlug && !domainWorkspaces.some((w) => w.slug === routeSlug)) return { kind: "navigate", to: "/" };
  // No workspace to ask about: the page itself says so
  if (!slug) return { kind: "enter" };
  if (!access) return { kind: "loading" };

  const isKb = pathname === `${basePath}/kb` || pathname.startsWith(`${basePath}/kb/`);
  if (isKb ? access.publicKbEnabled : access.portalEnabled) return { kind: "enter" };
  if (isKb && access.portalEnabled) return { kind: "navigate", to: basePath };
  return { kind: "navigate", to: portalSignInPath({ workspaceSlug: slug }) };
}
