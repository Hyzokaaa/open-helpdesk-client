import axios from "axios";

/** What a workspace lets people do without signing in */
export interface PortalAccess {
  portalEnabled: boolean;
  publicKbEnabled: boolean;
}

/** Older servers do not say: the portal and the knowledge base were always open then */
export function portalAccessOf(source: Partial<PortalAccess> | null | undefined): PortalAccess {
  return { portalEnabled: source?.portalEnabled ?? true, publicKbEnabled: source?.publicKbEnabled ?? true };
}

/** The server refused because the workspace's portal is closed: people sign in instead */
export function isPortalClosedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404 && error.response.data?.error === "PortalClosedError";
}

/**
 * The sign-in page for a closed portal. `portal` names the workspace (its articles may still be
 * public); `from=portal` keeps the sign-in on this domain, without the session handoff (#37).
 */
export function portalSignInPath(options: { workspaceSlug?: string; notice?: "portal-link"; redirect?: string } = {}): string {
  const params = new URLSearchParams({ from: "portal" });
  if (options.workspaceSlug) params.set("portal", options.workspaceSlug);
  if (options.notice) params.set("notice", options.notice);
  if (options.redirect) params.set("redirect", options.redirect);
  return `/login?${params.toString()}`;
}

/** Where a portal link leads once signed in, while the portal is closed */
export function portalLinkDashboardPath(token: string): string {
  return `/dashboard/portal-link/${encodeURIComponent(token)}`;
}
