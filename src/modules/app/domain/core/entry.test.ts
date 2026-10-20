import { describe, expect, it } from "vitest";
import { isClosedPortalSignIn, panelEntry, panelSignInPath, portalEntry, rootEntry, signInEntry, type SessionState } from "./entry";

// Every way into the app, by what the page knows. "Main" is the installation's own address,
// "custom" a workspace's custom domain, which can pick up the main address's session (#37).
const main: SessionState = { hasSession: false, canHandoff: false, handoffTriedRecently: false };
const custom: SessionState = { hasSession: false, canHandoff: true, handoffTriedRecently: false };
const signedIn = { hasSession: true };
const triedLately = { handoffTriedRecently: true };

const open = { slug: "acme", portalEnabled: true, publicKbEnabled: true };
const closed = { slug: "acme", portalEnabled: false, publicKbEnabled: false };
const closedKbPublic = { slug: "acme", portalEnabled: false, publicKbEnabled: true };
const openKbPrivate = { slug: "acme", portalEnabled: true, publicKbEnabled: false };

const q = (query: string) => new URLSearchParams(query);
const closedPortalSignIn = "/login?from=portal&portal=acme&redirect=%2Fdashboard%2Fportal%2Facme";

describe("panel pages", () => {
  const page = { signedOutHere: false, path: "/dashboard/workspaces/acme/tickets" };

  it("go in with a session here, on either address", () => {
    expect(panelEntry({ ...main, ...signedIn, ...page })).toEqual({ kind: "enter" });
    expect(panelEntry({ ...custom, ...signedIn, ...page })).toEqual({ kind: "enter" });
  });

  it("on a custom domain without one, look for the main address's session and come back to the page", () => {
    expect(panelEntry({ ...custom, ...page })).toEqual({ kind: "handoff", redirect: page.path });
  });

  it("sign in, coming back to the page, when the trip was just made or there is no main address to ask", () => {
    const signIn = { kind: "navigate", to: "/login?redirect=%2Fdashboard%2Fworkspaces%2Facme%2Ftickets" };
    expect(panelEntry({ ...custom, ...triedLately, ...page })).toEqual(signIn);
    expect(panelEntry({ ...main, ...page })).toEqual(signIn);
  });

  it("coming back to the panel's home needs no return address", () => {
    expect(panelEntry({ ...main, signedOutHere: false, path: "/dashboard" })).toEqual({ kind: "navigate", to: "/login" });
    expect(panelSignInPath(false, "/dashboard?tab=x")).toBe("/login?redirect=%2Fdashboard%3Ftab%3Dx");
  });

  it("right after signing out, a plain sign-in page, without a trip", () => {
    expect(panelEntry({ ...main, ...page, signedOutHere: true })).toEqual({ kind: "navigate", to: "/login" });
    expect(panelEntry({ ...custom, ...triedLately, ...page, signedOutHere: true })).toEqual({ kind: "navigate", to: "/login" });
  });
});

describe("the sign-in page", () => {
  const at = (query: string, domains: { slug: string; portalEnabled?: boolean }[] | null = null) => ({
    search: q(query),
    closedPortal: isClosedPortalSignIn(q(query), domains),
    currentUrl: `/login?${query}`,
  });

  it("is for customers only when a closed portal sent them", () => {
    expect(isClosedPortalSignIn(q("from=portal&portal=acme"), null)).toBe(true);
    expect(isClosedPortalSignIn(q("from=portal&notice=portal-link"), null)).toBe(true);
    expect(isClosedPortalSignIn(q("from=portal"), [closed])).toBe(true);
    // The "Sign in" link of an open portal, or the team's own sign-in
    expect(isClosedPortalSignIn(q("from=portal"), [open])).toBe(false);
    expect(isClosedPortalSignIn(q("from=portal"), null)).toBe(false);
    expect(isClosedPortalSignIn(q("portal=acme"), null)).toBe(false);
  });

  describe("sent by a closed portal", () => {
    const query = "from=portal&portal=acme&redirect=%2Fdashboard%2Fportal%2Facme";

    it("goes straight on with a session here, on either address", () => {
      expect(signInEntry({ ...main, ...signedIn, ...at(query) })).toEqual({ kind: "go", redirect: "/dashboard/portal/acme" });
      expect(signInEntry({ ...custom, ...signedIn, ...at(query) })).toEqual({ kind: "go", redirect: "/dashboard/portal/acme" });
    });

    it("an old ticket link goes straight to its ticket with a session", () => {
      const link = "from=portal&notice=portal-link&redirect=%2Fdashboard%2Fportal-link%2Ftok";
      expect(signInEntry({ ...main, ...signedIn, ...at(link) })).toEqual({ kind: "go", redirect: "/dashboard/portal-link/tok" });
    });

    it("on a custom domain without one, looks for the main address's session and comes back to this same page", () => {
      expect(signInEntry({ ...custom, ...at(query) })).toEqual({
        kind: "handoff",
        redirect: "/dashboard/portal/acme",
        signIn: closedPortalSignIn,
      });
    });

    it("shows the form when the trip was just made, on the main address, or after an expiry", () => {
      expect(signInEntry({ ...custom, ...triedLately, ...at(query) })).toEqual({ kind: "form" });
      expect(signInEntry({ ...main, ...at(query) })).toEqual({ kind: "form" });
      expect(signInEntry({ ...custom, ...at(`${query}&expired=1`) })).toEqual({ kind: "form" });
    });
  });

  describe("from an open portal or for the team", () => {
    it("an open portal's sign-in never leaves the custom domain, nor skips the form", () => {
      expect(signInEntry({ ...custom, ...at("from=portal", [open]) })).toEqual({ kind: "form" });
      expect(signInEntry({ ...custom, ...signedIn, ...at("from=portal", [open]) })).toEqual({ kind: "form" });
    });

    it("the team's sign-in on a custom domain looks for the main address's session, back to a plain page without one", () => {
      expect(signInEntry({ ...custom, ...at("redirect=%2Fdashboard") })).toEqual({ kind: "handoff", redirect: "/dashboard" });
      expect(signInEntry({ ...custom, ...at("") })).toEqual({ kind: "handoff", redirect: "/dashboard" });
    });

    it("never sends the trip back to another site", () => {
      expect(signInEntry({ ...custom, ...at("redirect=%2F%2Fevil.example") })).toEqual({ kind: "handoff", redirect: "/dashboard" });
    });

    it("shows the form on the main address, after an expiry, or when the trip was just made", () => {
      expect(signInEntry({ ...main, ...at("redirect=%2Fdashboard") })).toEqual({ kind: "form" });
      expect(signInEntry({ ...custom, ...at("expired=1") })).toEqual({ kind: "form" });
      expect(signInEntry({ ...custom, ...triedLately, ...at("") })).toEqual({ kind: "form" });
    });
  });
});

describe("the root of the app", () => {
  it("on the main address: the panel with a session, sign-in without", () => {
    expect(rootEntry(null, true)).toEqual({ kind: "navigate", to: "/dashboard" });
    expect(rootEntry(null, false)).toEqual({ kind: "navigate", to: "/login" });
  });

  it("on a custom domain of one workspace: its portal while open, else the panel or a plain sign-in page", () => {
    expect(rootEntry([open], false)).toEqual({ kind: "navigate", to: "/portal" });
    expect(rootEntry([open], true)).toEqual({ kind: "navigate", to: "/portal" });
    // Closed: the root says nothing of the portal; only /portal does
    expect(rootEntry([closed], false)).toEqual({ kind: "navigate", to: "/login" });
    expect(rootEntry([closed], true)).toEqual({ kind: "navigate", to: "/dashboard" });
    expect(rootEntry([closedKbPublic], false)).toEqual({ kind: "navigate", to: "/login" });
  });

  it("on a custom domain of several: the selector while any portal is open, else the panel or a plain sign-in page", () => {
    expect(rootEntry([open, { ...closed, slug: "beta" }], false)).toEqual({ kind: "portal-selector" });
    expect(rootEntry([closed, { ...closed, slug: "beta" }], false)).toEqual({ kind: "navigate", to: "/login" });
    expect(rootEntry([closed, { ...closed, slug: "beta" }], true)).toEqual({ kind: "navigate", to: "/dashboard" });
  });

  it("treats workspaces from older servers, which do not say, as open", () => {
    expect(rootEntry([{ slug: "acme" }], false)).toEqual({ kind: "navigate", to: "/portal" });
  });
});

describe("customer portal pages", () => {
  const onMain = { domainWorkspaces: null, routeSlug: "acme", slug: "acme", basePath: "/portal/acme" };

  it("waits for the workspace's portal state", () => {
    expect(portalEntry({ ...onMain, pathname: "/portal/acme", access: null })).toEqual({ kind: "loading" });
  });

  it("an open portal and a public knowledge base go in", () => {
    expect(portalEntry({ ...onMain, pathname: "/portal/acme", access: open })).toEqual({ kind: "enter" });
    expect(portalEntry({ ...onMain, pathname: "/portal/acme/kb", access: open })).toEqual({ kind: "enter" });
  });

  it("a closed portal leads to the customers' sign-in, on the main address and on the custom domain", () => {
    expect(portalEntry({ ...onMain, pathname: "/portal/acme", access: closed })).toEqual({ kind: "navigate", to: closedPortalSignIn });
    const onCustom = { domainWorkspaces: [closed], slug: "acme", basePath: "/portal" };
    expect(portalEntry({ ...onCustom, pathname: "/portal", access: closed })).toEqual({ kind: "navigate", to: closedPortalSignIn });
  });

  it("the knowledge base follows its own switch", () => {
    expect(portalEntry({ ...onMain, pathname: "/portal/acme/kb/article/x", access: closedKbPublic })).toEqual({ kind: "enter" });
    expect(portalEntry({ ...onMain, pathname: "/portal/acme/kb", access: openKbPrivate })).toEqual({ kind: "navigate", to: "/portal/acme" });
    expect(portalEntry({ ...onMain, pathname: "/portal/acme/kb", access: closed })).toEqual({ kind: "navigate", to: closedPortalSignIn });
    // A page whose name starts like the knowledge base's is not one of its pages
    expect(portalEntry({ ...onMain, pathname: "/portal/acme/kbx", access: openKbPrivate })).toEqual({ kind: "enter" });
  });

  it("a custom domain only serves its own workspaces", () => {
    const onCustom = { domainWorkspaces: [open], routeSlug: "other", slug: "other", basePath: "/portal/other" };
    expect(portalEntry({ ...onCustom, pathname: "/portal/other", access: open })).toEqual({ kind: "navigate", to: "/" });
  });

  it("without a workspace to ask about, the page itself says so", () => {
    expect(portalEntry({ domainWorkspaces: null, basePath: "/portal", pathname: "/portal", access: null })).toEqual({ kind: "enter" });
  });
});
