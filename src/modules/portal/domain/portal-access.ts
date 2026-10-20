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

/** A custom domain's workspaces with one workspace's new settings; the others, and none, unchanged */
export function withPortalAccess<T extends { slug: string }>(workspaces: T[] | null, slug: string, access: PortalAccess): T[] | null {
  return workspaces?.map((w) => (w.slug === slug ? { ...w, ...access } : w)) ?? workspaces;
}

/** The server refused because the workspace's portal is closed: people sign in instead */
export function isPortalClosedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404 && error.response.data?.error === "PortalClosedError";
}

/**
 * The sign-in page for a closed portal. `portal` names the workspace (its articles may still be
 * public) and, unless told otherwise, leads to it in the dashboard once signed in. Someone already
 * signed in, here or on the installation's address (#37), goes straight on.
 */
export function portalSignInPath(options: { workspaceSlug?: string; notice?: "portal-link"; redirect?: string } = {}): string {
  const params = new URLSearchParams({ from: "portal" });
  if (options.workspaceSlug) params.set("portal", options.workspaceSlug);
  if (options.notice) params.set("notice", options.notice);
  const redirect = options.redirect ?? (options.workspaceSlug ? portalHomeDashboardPath(options.workspaceSlug) : undefined);
  if (redirect) params.set("redirect", redirect);
  return `/login?${params.toString()}`;
}

/** Where a closed portal leads once signed in: the workspace's tickets, or the dashboard for a non-member */
export function portalHomeDashboardPath(workspaceSlug: string): string {
  return `/dashboard/portal/${encodeURIComponent(workspaceSlug)}`;
}

/** Where a portal link leads once signed in, while the portal is closed */
export function portalLinkDashboardPath(token: string): string {
  return `/dashboard/portal-link/${encodeURIComponent(token)}`;
}
