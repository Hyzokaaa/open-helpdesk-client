import { describe, expect, it } from "vitest";
import { privacyWorkspaceSlug, workspaceSlugFor } from "./workspace-context";

const ONE = [{ slug: "acme" }];
const TWO = [{ slug: "acme" }, { slug: "globex" }];

describe("workspace context of a page", () => {
  it.each([
    ["/dashboard/workspaces/acme", "acme"],
    ["/dashboard/workspaces/acme/tickets/01HZX5C3V9J8Q2W4E6R8T0Y1U3", "acme"],
    ["/dashboard/workspaces/acme/settings?tab=x", "acme"],
    ["/portal/acme", "acme"],
    ["/portal/acme/kb/article/how-to", "acme"],
    ["/dashboard/workspaces/new", null],
    ["/dashboard", null],
    ["/dashboard/settings/account", null],
    ["/dashboard/admin/analytics", null],
    ["/login", null],
    ["/signup", null],
    ["/privacy", null],
    ["/docs/webhooks", null],
    ["/", null],
    ["/portal", null],
    ["/portal/kb/billing", null],
    ["/portal/tickets/token", null],
  ])("%s outside a custom domain is in %s", (path, slug) => {
    expect(workspaceSlugFor(path, null)).toBe(slug);
  });

  it("uses the custom domain's workspace for the slugless portal, like the portal pages do", () => {
    expect(workspaceSlugFor("/portal", ONE)).toBe("acme");
    expect(workspaceSlugFor("/portal/kb/article/x", TWO)).toBe("acme");
    expect(workspaceSlugFor("/portal/globex/kb", TWO)).toBe("globex");
  });

  it("attributes the ticket tracking page only when the domain serves exactly one workspace", () => {
    expect(workspaceSlugFor("/portal/tickets/token", ONE)).toBe("acme");
    expect(workspaceSlugFor("/portal/tickets/token", TWO)).toBeNull();
  });

  it("keeps login, legal and account pages outside the workspace even on its custom domain", () => {
    expect(workspaceSlugFor("/login", ONE)).toBeNull();
    expect(workspaceSlugFor("/privacy", ONE)).toBeNull();
    expect(workspaceSlugFor("/dashboard/settings/account", ONE)).toBeNull();
  });
});

describe("workspace the privacy policy speaks for", () => {
  it("is the workspace the visitor came from, else the custom domain's only workspace", () => {
    expect(privacyWorkspaceSlug("acme", null)).toBe("acme");
    expect(privacyWorkspaceSlug(null, ONE)).toBe("acme");
    expect(privacyWorkspaceSlug(null, TWO)).toBeNull();
    expect(privacyWorkspaceSlug("globex", TWO)).toBe("globex");
    expect(privacyWorkspaceSlug("other", ONE)).toBe("acme");
    expect(privacyWorkspaceSlug(null, null)).toBeNull();
  });
});
