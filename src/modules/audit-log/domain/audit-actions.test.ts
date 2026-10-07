import { describe, expect, it } from "vitest";
import { ALL_AUDIT_ACTIONS, actionGroup, actionOptions, entityTypeLabel, isSystemOnlyAction } from "./audit-actions";

const identity = (key: string) => key;

describe("audit actions", () => {
  it("offers every translated action, including ones no hand-kept list had", () => {
    expect(ALL_AUDIT_ACTIONS).toEqual(expect.arrayContaining(["ticket-created", "permission-denied", "email-rule-created", "payment-received"]));
  });

  it("groups actions by what they are about", () => {
    expect(actionGroup("ticket-assigned")).toBe("Ticket");
    expect(actionGroup("portal-comment-created")).toBe("Ticket");
    expect(actionGroup("organization-member-added")).toBe("Members");
    expect(actionGroup("user-login-failed")).toBe("Security");
    expect(actionGroup("imap-poll-failed")).toBe("Email");
    expect(actionGroup("subscription-cancelled")).toBe("Billing");
    expect(actionGroup("workspace-logo-updated")).toBe("Workspace");
    expect(actionGroup("canned-response-updated")).toBe("Config");
  });

  it("keeps installation-wide actions out of the workspace filters", () => {
    expect(isSystemOnlyAction("user-login-failed")).toBe(true);
    expect(isSystemOnlyAction("system-logo-updated")).toBe(true);
    expect(isSystemOnlyAction("payment-received")).toBe(true);
    expect(isSystemOnlyAction("user-created")).toBe(false);
    expect(isSystemOnlyAction("permission-denied")).toBe(false);
    expect(isSystemOnlyAction("ticket-created")).toBe(false);

    const workspace = actionOptions("workspace", identity).map((o) => o.value);
    const system = actionOptions("system", identity).map((o) => o.value);
    expect(workspace).not.toContain("user-login-failed");
    expect(system).toContain("user-login-failed");
    expect(workspace).toContain("permission-denied");
  });

  it("names an entity type when there is a translation, and keeps the type otherwise", () => {
    const t = (key: string) => (key === "auditLog.entity.ticket" ? "Ticket" : key);
    expect(entityTypeLabel("ticket", t)).toBe("Ticket");
    expect(entityTypeLabel("something-new", t)).toBe("something-new");
  });
});
