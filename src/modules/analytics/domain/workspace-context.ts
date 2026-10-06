import { matchPath } from "react-router";

/** Literal segments under `/portal` that are not a workspace slug (see the portal routes in `App.tsx`). */
const PORTAL_RESERVED = new Set(["kb", "tickets"]);
/** Literal segments under `/dashboard/workspaces` that are not a workspace slug. */
const DASHBOARD_RESERVED = new Set(["new"]);

/** What the analytics context needs from the custom-domain resolution in `ConfigProvider`. */
export interface DomainWorkspaceRef {
  slug: string;
}

function slugAt(pattern: string, pathname: string, reserved: Set<string>): string | null {
  const slug = matchPath(pattern, pathname)?.params.workspaceSlug;
  return slug && !reserved.has(slug) ? slug : null;
}

/**
 * The workspace a page belongs to for analytics, or null for pages outside any workspace:
 *
 * - `/dashboard/workspaces/:workspaceSlug/...`: that workspace's dashboard pages.
 * - `/portal/:workspaceSlug/...`: that workspace's portal and knowledge base.
 * - On a custom domain, every other page belongs to the domain's workspace: the slugless
 *   portal, the ticket tracking page, login, password reset, legal pages, account settings.
 *   With "Share usage with Open Helpdesk" off, the installation's tracker is then absent from
 *   the whole domain.
 * - Elsewhere (landing, login, signup, account settings, system admin, docs, legal on the
 *   installation's own domain) the page belongs to none.
 *
 * Only the pathname is read, and the slug never reaches a tracker: it only picks which ones
 * receive the page.
 */
export function workspaceSlugFor(path: string, domainWorkspaces: readonly DomainWorkspaceRef[] | null): string | null {
  const pathname = path.split(/[?#]/, 1)[0] || "/";

  const dashboard = slugAt("/dashboard/workspaces/:workspaceSlug/*", pathname, DASHBOARD_RESERVED);
  if (dashboard) return dashboard;

  if (!matchPath("/portal/tickets/:portalToken", pathname)) {
    const portal = slugAt("/portal/:workspaceSlug/*", pathname, PORTAL_RESERVED);
    if (portal) return portal;
  }

  // On a custom domain every other page (login, password reset, privacy, the slugless portal…)
  // is part of the customer's site: it belongs to the domain's workspace, the first one, as the
  // portal pages pick it (`usePortalSlug`).
  return domainWorkspaces?.[0]?.slug ?? null;
}

/**
 * The workspace the privacy policy speaks for: the one the visitor came from in this page
 * load, else the custom domain's workspace when the domain serves exactly one.
 */
export function privacyWorkspaceSlug(lastWorkspace: string | null, domainWorkspaces: readonly DomainWorkspaceRef[] | null): string | null {
  if (lastWorkspace && (!domainWorkspaces || domainWorkspaces.some((w) => w.slug === lastWorkspace))) return lastWorkspace;
  return domainWorkspaces?.length === 1 ? domainWorkspaces[0].slug : null;
}
