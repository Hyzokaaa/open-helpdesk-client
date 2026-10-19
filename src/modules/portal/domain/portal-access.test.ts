import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { isPortalClosedError, portalAccessOf, portalLinkDashboardPath, portalSignInPath } from "./portal-access";

const httpError = (status: number, data: unknown) =>
  new AxiosError("x", "ERR", undefined, undefined, { status, data, statusText: "", headers: {}, config: { headers: new AxiosHeaders() } });

describe("portal access", () => {
  it("treats a server that does not say as open, as the portal always was", () => {
    expect(portalAccessOf(undefined)).toEqual({ portalEnabled: true, publicKbEnabled: true });
    expect(portalAccessOf({ portalEnabled: false })).toEqual({ portalEnabled: false, publicKbEnabled: true });
  });

  it("tells a closed portal from any other 404", () => {
    expect(isPortalClosedError(httpError(404, { error: "PortalClosedError" }))).toBe(true);
    expect(isPortalClosedError(httpError(404, { error: "EntityNotFoundError" }))).toBe(false);
    expect(isPortalClosedError(new Error("network"))).toBe(false);
  });

  it("sends people to sign in on this domain, saying where they came from and where to go next", () => {
    expect(portalSignInPath({ workspaceSlug: "acme" })).toBe("/login?from=portal&portal=acme");
    const path = portalSignInPath({ notice: "portal-link", redirect: portalLinkDashboardPath("tok") });
    expect(new URLSearchParams(path.split("?")[1]).get("redirect")).toBe("/dashboard/portal-link/tok");
    expect(path).toContain("notice=portal-link");
  });
});
