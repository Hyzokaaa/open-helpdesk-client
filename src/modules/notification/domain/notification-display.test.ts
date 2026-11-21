import { describe, expect, it } from "vitest";
import { noticeLabel, notificationLabel, notificationTarget, unreadBadge } from "./notification-display";

describe("notification display", () => {
  it("counts the unread on the bell up to 99, and shows nothing when all is read", () => {
    expect(unreadBadge(0)).toBeNull();
    expect(unreadBadge(7)).toBe("7");
    expect(unreadBadge(99)).toBe("99");
    expect(unreadBadge(100)).toBe("99+");
  });

  const t = (key: string) => `t:${key}`;

  it("names every type, the new version and expired invitations included", () => {
    expect(notificationLabel({ type: "invitation-expired" }, "en", t)).toBe("t:notifications.invitationExpired");
    expect(notificationLabel({ type: "upgrade-available" }, "en", t)).toBe("t:notifications.upgradeAvailable");
    expect(notificationLabel({ type: "unattended-reply" }, "en", t)).toBe("t:notifications.unattendedReply");
  });

  it("names a notice as the server does, and never calls a kind it does not know a new ticket", () => {
    expect(notificationLabel({ type: "member-joined", label: { en: "New team member", es: "Nuevo miembro" } }, "es", t)).toBe("Nuevo miembro");
    expect(notificationLabel({ type: "payment-failed", label: null }, "en", t)).toBe("");
  });

  it("opens the ticket, the invitations page or the updates page", () => {
    expect(notificationTarget({ type: "comment-created", ticketId: "t1", workspaceSlug: "ws" })).toBe("/dashboard/workspaces/ws/tickets?open=t1");
    expect(notificationTarget({ type: "unattended-reply", ticketId: "t1", workspaceSlug: "ws" })).toBe("/dashboard/workspaces/ws/tickets?open=t1");
    expect(notificationTarget({ type: "invitation-expired", ticketId: null, workspaceSlug: "ws" })).toBe("/dashboard/workspaces/ws/invitations");
    expect(notificationTarget({ type: "upgrade-available", ticketId: null, workspaceSlug: null })).toBe("/dashboard/admin/updates");
  });

  it("opens where a notice that is not about a ticket says, and names it as the server does", () => {
    expect(notificationTarget({ type: "member-joined", ticketId: null, workspaceSlug: "ws", link: "/dashboard/workspaces/ws/members" })).toBe("/dashboard/workspaces/ws/members");
    expect(notificationTarget({ type: "payment-failed", ticketId: null, workspaceSlug: "" })).toBeNull();
    expect(noticeLabel({ en: "New team member", es: "Nuevo miembro" }, "es")).toBe("Nuevo miembro");
    expect(noticeLabel({ en: "New team member", es: "Nuevo miembro" }, "fr")).toBe("New team member");
  });
});
