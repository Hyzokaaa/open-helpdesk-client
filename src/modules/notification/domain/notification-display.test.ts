import { describe, expect, it } from "vitest";
import { notificationLabelKey, notificationTarget } from "./notification-display";

describe("notification display", () => {
  it("names every type, the new version and expired invitations included", () => {
    expect(notificationLabelKey("invitation-expired")).toBe("notifications.invitationExpired");
    expect(notificationLabelKey("upgrade-available")).toBe("notifications.upgradeAvailable");
  });

  it("opens the ticket, the invitations page or the updates page", () => {
    expect(notificationTarget({ type: "comment-created", ticketId: "t1", workspaceSlug: "ws" })).toBe("/dashboard/workspaces/ws/tickets?open=t1");
    expect(notificationTarget({ type: "invitation-expired", ticketId: null, workspaceSlug: "ws" })).toBe("/dashboard/workspaces/ws/invitations");
    expect(notificationTarget({ type: "upgrade-available", ticketId: null, workspaceSlug: null })).toBe("/dashboard/admin/updates");
  });
});
