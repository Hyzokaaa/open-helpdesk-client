import { describe, it, expect } from "vitest";
import { P } from "@modules/workspace/domain/permissions";
import { canDiscardFromQueue, canMoveTicketStatus } from "./can-move-ticket-status";

const seesAll = (p: string) => p === P.TICKET_VIEW || p === P.TICKET_CHANGE_STATUS;
const seesOwn = (p: string) => p === P.TICKET_VIEW_OWN || p === P.TICKET_CHANGE_STATUS;
const readsOwn = (p: string) => p === P.TICKET_VIEW_OWN;

describe("canMoveTicketStatus", () => {
  it("lets roles that see every ticket move any of them", () => {
    expect(canMoveTicketStatus({ assigneeId: null }, "sup-1", seesAll)).toBe(true);
    expect(canMoveTicketStatus({ assigneeId: "agent-2" }, "sup-1", seesAll)).toBe(true);
  });

  it("lets an agent move a ticket assigned to them", () => {
    expect(canMoveTicketStatus({ assigneeId: "agent-1" }, "agent-1", seesOwn)).toBe(true);
  });

  it("does not let an agent move an unassigned ticket", () => {
    expect(canMoveTicketStatus({ assigneeId: null }, "agent-1", seesOwn)).toBe(false);
  });

  it("does not let an agent move a ticket assigned to someone else", () => {
    expect(canMoveTicketStatus({ assigneeId: "agent-2" }, "agent-1", seesOwn)).toBe(false);
  });

  it("does not match an unassigned ticket against a missing user", () => {
    expect(canMoveTicketStatus({ assigneeId: null }, undefined, seesOwn)).toBe(false);
  });
});

describe("canDiscardFromQueue", () => {
  it("lets an agent discard an open ticket nobody has taken", () => {
    expect(canDiscardFromQueue({ status: "open", assigneeId: null }, "agent-1", seesOwn)).toBe(true);
  });

  it("does not apply once the ticket has left the queue", () => {
    expect(canDiscardFromQueue({ status: "pending", assigneeId: null }, "agent-1", seesOwn)).toBe(false);
  });

  it("does not apply to an open ticket someone already holds", () => {
    expect(canDiscardFromQueue({ status: "open", assigneeId: "agent-2" }, "agent-1", seesOwn)).toBe(false);
  });

  it("does not apply to roles that can change the status freely", () => {
    expect(canDiscardFromQueue({ status: "open", assigneeId: null }, "sup-1", seesAll)).toBe(false);
  });

  it("requires the permission to change status", () => {
    expect(canDiscardFromQueue({ status: "open", assigneeId: null }, "user-1", readsOwn)).toBe(false);
  });
});
