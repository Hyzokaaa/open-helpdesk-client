import { matchPath } from "react-router";

/**
 * What analytics may know about a page: the route pattern, never the real URL. Real URLs carry
 * secrets (`/portal/tickets/:portalToken`, `/invite/:token`, `?token=` on reset and verify,
 * `?code=` on the OAuth callback) and customer data (slugs, ticket ids), so a page view only
 * ever reports a pattern from this catalogue, and a path that matches none reports `/unknown`.
 *
 * Titles are fixed English strings so reports are not split by the visitor's language.
 */
export interface AnalyticsRoute {
  pattern: string;
  title: string;
}

export const UNKNOWN_ROUTE: AnalyticsRoute = { pattern: "/unknown", title: "Unknown" };

const WS = "/dashboard/workspaces/:workspaceSlug";

/** Every `<Route path>` in `src/App.tsx`, nested dashboard routes resolved to full paths. */
const CORE_ROUTES: AnalyticsRoute[] = [
  { pattern: "/", title: "Home" },

  // Legal and public docs
  { pattern: "/privacy", title: "Privacy policy" },
  { pattern: "/terms", title: "Terms of service" },
  { pattern: "/docs", title: "API docs" },
  { pattern: "/docs/:section", title: "API docs section" },
  { pattern: "/docs/reference/:operation", title: "API reference" },

  // Authentication
  { pattern: "/login", title: "Login" },
  { pattern: "/signup", title: "Signup" },
  { pattern: "/auth/callback", title: "OAuth callback" },
  { pattern: "/verify-email", title: "Verify email" },
  { pattern: "/forgot-password", title: "Forgot password" },
  { pattern: "/reset-password", title: "Reset password" },
  { pattern: "/onboarding", title: "Onboarding" },
  { pattern: "/invite/:token", title: "Invitation" },

  // Customer portal
  { pattern: "/portal", title: "Portal" },
  { pattern: "/portal/kb", title: "Portal knowledge base" },
  { pattern: "/portal/kb/:categorySlug", title: "Portal knowledge base category" },
  { pattern: "/portal/kb/article/:articleSlug", title: "Portal knowledge base article" },
  { pattern: "/portal/:workspaceSlug", title: "Portal" },
  { pattern: "/portal/:workspaceSlug/kb", title: "Portal knowledge base" },
  { pattern: "/portal/:workspaceSlug/kb/:categorySlug", title: "Portal knowledge base category" },
  { pattern: "/portal/:workspaceSlug/kb/article/:articleSlug", title: "Portal knowledge base article" },
  { pattern: "/portal/tickets/:portalToken", title: "Portal ticket" },

  // Dashboard
  { pattern: "/dashboard", title: "Workspaces" },
  { pattern: "/dashboard/workspaces/new", title: "New workspace" },
  { pattern: WS, title: "Workspace" },
  { pattern: `${WS}/settings`, title: "Workspace settings" },
  { pattern: `${WS}/audit-log`, title: "Workspace audit log" },
  { pattern: `${WS}/members`, title: "Members" },
  { pattern: `${WS}/contacts`, title: "Contacts" },
  { pattern: `${WS}/invitations`, title: "Invitations" },
  { pattern: `${WS}/tags`, title: "Tags" },
  { pattern: `${WS}/departments`, title: "Departments" },
  { pattern: `${WS}/organizations`, title: "Organizations" },
  { pattern: `${WS}/projects`, title: "Projects" },
  { pattern: `${WS}/categories`, title: "Categories" },
  { pattern: `${WS}/canned-responses`, title: "Canned responses" },
  { pattern: `${WS}/email-rules`, title: "Email rules" },
  { pattern: `${WS}/custom-fields`, title: "Custom fields" },
  { pattern: `${WS}/knowledge-base`, title: "Knowledge base" },
  { pattern: `${WS}/reports`, title: "Reports" },
  { pattern: `${WS}/stats`, title: "User stats" },
  { pattern: `${WS}/stats/:userId`, title: "User stats" },
  { pattern: `${WS}/tickets`, title: "Tickets" },
  { pattern: `${WS}/tickets/new`, title: "New ticket" },
  { pattern: `${WS}/tickets/:ticketId`, title: "Ticket detail" },
  { pattern: "/dashboard/notifications", title: "Notifications" },
  { pattern: "/dashboard/settings", title: "User settings" },
  { pattern: "/dashboard/settings/account", title: "Account settings" },
  { pattern: "/dashboard/settings/security", title: "Security settings" },
  { pattern: "/dashboard/settings/preferences", title: "Preferences" },
  { pattern: "/dashboard/settings/notifications", title: "Notification settings" },
  { pattern: "/dashboard/changelog", title: "Changelog" },

  // System administration
  { pattern: "/dashboard/admin", title: "Admin" },
  { pattern: "/dashboard/admin/users", title: "Admin users" },
  { pattern: "/dashboard/admin/workspaces", title: "Admin workspaces" },
  { pattern: "/dashboard/admin/logs", title: "System logs" },
  { pattern: "/dashboard/admin/branding", title: "Admin branding" },
  { pattern: "/dashboard/admin/analytics", title: "Admin analytics" },
  { pattern: "/dashboard/admin/settings", title: "Admin settings" },
  { pattern: "/dashboard/admin/updates", title: "Admin updates" },
];

function segments(pattern: string): string[] {
  return pattern.split("/").filter(Boolean);
}

/**
 * Most specific first: longer patterns, then, segment by segment, a literal before a parameter,
 * so `/dashboard/workspaces/new` wins over `/dashboard/workspaces/:workspaceSlug`.
 */
function bySpecificity(a: AnalyticsRoute, b: AnalyticsRoute): number {
  const sa = segments(a.pattern);
  const sb = segments(b.pattern);
  if (sa.length !== sb.length) return sb.length - sa.length;
  for (let i = 0; i < sa.length; i++) {
    const pa = sa[i].startsWith(":") ? 0 : 1;
    const pb = sb[i].startsWith(":") ? 0 : 1;
    if (pa !== pb) return pb - pa;
  }
  return 0;
}

let catalogue: AnalyticsRoute[] = [...CORE_ROUTES].sort(bySpecificity);

/**
 * Adds routes an embedding client renders on top of the core ones (the cloud client's landing,
 * pricing and billing pages). An entry with a pattern already in the catalogue replaces it.
 */
export function registerAnalyticsRoutes(entries: AnalyticsRoute[]): void {
  const added = new Map(entries.map((e) => [e.pattern, e]));
  catalogue = [...catalogue.filter((e) => !added.has(e.pattern)), ...added.values()].sort(bySpecificity);
}

/** The catalogue as it stands, most specific first. */
export function getAnalyticsRoutes(): readonly AnalyticsRoute[] {
  return catalogue;
}

/**
 * The catalogue entry for a pathname, or `UNKNOWN_ROUTE`. Query string and hash are dropped
 * before matching, and the result never contains anything from the real path.
 */
export function resolveAnalyticsRoute(path: string): AnalyticsRoute {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  return catalogue.find((route) => matchPath(route.pattern, pathname) !== null) ?? UNKNOWN_ROUTE;
}
