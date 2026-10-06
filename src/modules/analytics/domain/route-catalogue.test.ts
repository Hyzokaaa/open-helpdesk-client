import { describe, expect, it } from "vitest";
import { getAnalyticsRoutes, registerAnalyticsRoutes, resolveAnalyticsRoute } from "./route-catalogue";

const WS = "/dashboard/workspaces/:workspaceSlug";

describe("route catalogue", () => {
  it.each([
    ["/", "/", "Home"],
    ["/login", "/login", "Login"],
    ["/docs/reference/createTicket", "/docs/reference/:operation", "API reference"],
    ["/docs/webhooks", "/docs/:section", "API docs section"],
    ["/portal/kb", "/portal/kb", "Portal knowledge base"],
    ["/portal/kb/article/how-to-reset", "/portal/kb/article/:articleSlug", "Portal knowledge base article"],
    ["/portal/kb/billing", "/portal/kb/:categorySlug", "Portal knowledge base category"],
    ["/portal/acme", "/portal/:workspaceSlug", "Portal"],
    ["/portal/acme/kb/article/x", "/portal/:workspaceSlug/kb/article/:articleSlug", "Portal knowledge base article"],
    ["/dashboard", "/dashboard", "Workspaces"],
    ["/dashboard/workspaces/new", "/dashboard/workspaces/new", "New workspace"],
    ["/dashboard/workspaces/acme", WS, "Workspace"],
    ["/dashboard/workspaces/acme/tickets", `${WS}/tickets`, "Tickets"],
    ["/dashboard/workspaces/acme/tickets/new", `${WS}/tickets/new`, "New ticket"],
    ["/dashboard/workspaces/acme/tickets/01HZX5C3V9J8Q2W4E6R8T0Y1U3", `${WS}/tickets/:ticketId`, "Ticket detail"],
    ["/dashboard/workspaces/acme/stats/01HZX5C3V9J8Q2W4E6R8T0Y1U3", `${WS}/stats/:userId`, "User stats"],
    ["/dashboard/settings/security", "/dashboard/settings/security", "Security settings"],
    ["/dashboard/admin/analytics", "/dashboard/admin/analytics", "Admin analytics"],
  ])("%s reports %s", (path, pattern, title) => {
    expect(resolveAnalyticsRoute(path)).toEqual({ pattern, title });
  });

  it.each([
    ["/portal/tickets/s3cr3t-portal-token", "/portal/tickets/:portalToken"],
    ["/invite/s3cr3t-invite-token", "/invite/:token"],
    ["/reset-password?token=s3cr3t", "/reset-password"],
    ["/verify-email?token=s3cr3t", "/verify-email"],
    ["/auth/callback?code=s3cr3t#state", "/auth/callback"],
  ])("never reports the secret in %s", (path, pattern) => {
    const route = resolveAnalyticsRoute(path);
    expect(route.pattern).toBe(pattern);
    expect(JSON.stringify(route)).not.toContain("s3cr3t");
  });

  it("reports a path outside the catalogue as /unknown, never raw", () => {
    expect(resolveAnalyticsRoute("/customer@example.com/whatever").pattern).toBe("/unknown");
    expect(resolveAnalyticsRoute("/dashboard/workspaces/acme/tickets/1/extra").pattern).toBe("/unknown");
  });

  it("lists every pattern once", () => {
    const patterns = getAnalyticsRoutes().map((r) => r.pattern);
    expect(new Set(patterns).size).toBe(patterns.length);
  });

  it("lets an embedding client add routes and replace one by pattern", () => {
    registerAnalyticsRoutes([
      { pattern: "/", title: "Landing" },
      { pattern: "/compare/:slug", title: "Compare" },
      { pattern: "/compare", title: "Compare index" },
    ]);
    expect(resolveAnalyticsRoute("/").title).toBe("Landing");
    expect(resolveAnalyticsRoute("/compare/zendesk")).toEqual({ pattern: "/compare/:slug", title: "Compare" });
    expect(resolveAnalyticsRoute("/compare").title).toBe("Compare index");
  });
});
