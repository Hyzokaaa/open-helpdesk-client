import { describe, expect, it } from "vitest";
import { canReopenTicket, initialReopenTarget, repliedAfterResolving, reopenNoteLength, reopenTargetsFor, statusesFrom } from "./ticket-reopen";

describe("reopening", () => {
  it("a closed ticket only changes between closed statuses", () => {
    expect(statusesFrom("resolved")).toEqual(["resolved", "discarded"]);
    expect(statusesFrom("in-progress")).toContain("open");
  });

  it("needs a closed ticket and the reopen permission", () => {
    const can = (p: string) => p === "ticket.reopen";
    expect(canReopenTicket({ status: "resolved" }, can)).toBe(true);
    expect(canReopenTicket({ status: "discarded" }, can)).toBe(true);
    expect(canReopenTicket({ status: "pending" }, can)).toBe(false);
    expect(canReopenTicket({ status: "resolved" }, () => false)).toBe(false);
  });

  it("starts where the card was dropped, and only those who assign can send it to the queue", () => {
    expect(initialReopenTarget("pending", true)).toBe("pending");
    expect(initialReopenTarget("open", true)).toBe("open");
    expect(initialReopenTarget("open", false)).toBe("in-progress");
    expect(initialReopenTarget("discarded", true)).toBe("in-progress");
    expect(initialReopenTarget(undefined, true)).toBe("in-progress");
    expect(reopenTargetsFor(false)).toEqual(["pending", "in-progress"]);
  });

  it("counts the note without the blanks around it", () => {
    expect(reopenNoteLength("   no   ")).toBe(2);
  });

  it("notices a reply of the requester after it was resolved", () => {
    const ticket = { status: "resolved", resolvedAt: "2026-09-18T14:00:00Z", reporterId: "maria" };
    expect(repliedAfterResolving(ticket, [{ authorId: "maria", createdAt: "2026-09-18T15:00:00Z" }])).toBe(true);
    expect(repliedAfterResolving(ticket, [{ authorId: "maria", createdAt: "2026-09-18T13:00:00Z" }])).toBe(false);
    expect(repliedAfterResolving(ticket, [{ authorId: "carlos", createdAt: "2026-09-18T15:00:00Z" }])).toBe(false);
    expect(repliedAfterResolving({ ...ticket, status: "in-progress" }, [{ authorId: "maria", createdAt: "2026-09-18T15:00:00Z" }])).toBe(false);
  });
});
