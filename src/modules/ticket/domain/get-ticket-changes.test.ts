import { describe, it, expect } from "vitest";
import { getTicketChanges, type TicketSnapshot, type ChangeLookups } from "./get-ticket-changes";

const baseLookups: ChangeLookups = {
  projects: [{ id: "p1", name: "Project A" }, { id: "p2", name: "Project B" }],
  categories: [{ id: "c1", name: "Bug" }, { id: "c2", name: "Feature" }],
  tags: [{ id: "t1", name: "urgent" }, { id: "t2", name: "backend" }, { id: "t3", name: "frontend" }],
  departments: [{ id: "d1", name: "Support" }, { id: "d2", name: "Engineering" }],
  organizations: [{ id: "o1", name: "IMSM" }, { id: "o2", name: "Acme" }],
  customFieldDefs: [{ id: "cf1", name: "Region" }, { id: "cf2", name: "Urgent" }],
  getMemberName: (id) => id === "u1" ? "John Doe" : id === "u2" ? "Jane Smith" : id,
  t: (key) => key,
  tEnum: (_prefix, value) => value,
};

function makeTicket(overrides: Partial<TicketSnapshot> = {}): TicketSnapshot {
  return {
    name: "Test ticket",
    description: "Some description",
    priority: "medium",
    status: "open",
    categoryId: "c1",
    projectId: "p1",
    assigneeId: "u1",
    tagIds: ["t1"],
    departmentId: "d1",
    organizationId: "o1",
    customFields: { cf1: "US", cf2: false },
    ...overrides,
  };
}

describe("getTicketChanges", () => {
  it("returns empty array when nothing changed", () => {
    const ticket = makeTicket();
    const draft = makeTicket();
    expect(getTicketChanges(ticket, draft, baseLookups)).toEqual([]);
  });

  it("detects name change", () => {
    const ticket = makeTicket();
    const draft = makeTicket({ name: "Updated ticket" });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ field: "ticketDetail.name", from: "Test ticket", to: "Updated ticket" });
  });

  it("detects description change with truncation", () => {
    const longDesc = "A".repeat(100);
    const ticket = makeTicket({ description: longDesc });
    const draft = makeTicket({ description: "Short" });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0].from).toBe("A".repeat(50) + "...");
    expect(changes[0].to).toBe("Short");
  });

  it("detects status change", () => {
    const ticket = makeTicket({ status: "open" });
    const draft = makeTicket({ status: "in-progress" });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ field: "ticketDetail.status", from: "open", to: "in-progress" });
  });

  it("detects priority change", () => {
    const ticket = makeTicket({ priority: "medium" });
    const draft = makeTicket({ priority: "high" });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0].field).toBe("ticketDetail.priority");
  });

  it("detects project change with name lookup", () => {
    const ticket = makeTicket({ projectId: "p1" });
    const draft = makeTicket({ projectId: "p2" });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ field: "ticketDetail.project", from: "Project A", to: "Project B" });
  });

  it("detects category change", () => {
    const ticket = makeTicket({ categoryId: "c1" });
    const draft = makeTicket({ categoryId: "c2" });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ field: "ticketDetail.category", from: "Bug", to: "Feature" });
  });

  it("detects assignee change with member name lookup", () => {
    const ticket = makeTicket({ assigneeId: "u1" });
    const draft = makeTicket({ assigneeId: "u2" });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ field: "ticketDetail.assignee", from: "John Doe", to: "Jane Smith" });
  });

  it("detects assignee removed (set to null)", () => {
    const ticket = makeTicket({ assigneeId: "u1" });
    const draft = makeTicket({ assigneeId: null });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0].to).toBe("—");
  });

  it("detects tag changes", () => {
    const ticket = makeTicket({ tagIds: ["t1"] });
    const draft = makeTicket({ tagIds: ["t1", "t2"] });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0].from).toBe("urgent");
    expect(changes[0].to).toBe("urgent, backend");
  });

  it("detects department change", () => {
    const ticket = makeTicket({ departmentId: "d1" });
    const draft = makeTicket({ departmentId: "d2" });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ field: "ticketDetail.department", from: "Support", to: "Engineering" });
  });

  it("detects organization change", () => {
    const ticket = makeTicket({ organizationId: "o1" });
    const draft = makeTicket({ organizationId: "o2" });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ field: "ticketDetail.organization", from: "IMSM", to: "Acme" });
  });

  it("detects custom field text change", () => {
    const ticket = makeTicket({ customFields: { cf1: "US", cf2: false } });
    const draft = makeTicket({ customFields: { cf1: "EU", cf2: false } });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ field: "Region", from: "US", to: "EU" });
  });

  it("detects custom field boolean change", () => {
    const ticket = makeTicket({ customFields: { cf1: "US", cf2: false } });
    const draft = makeTicket({ customFields: { cf1: "US", cf2: true } });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ field: "Urgent", from: "No", to: "Yes" });
  });

  it("detects custom field set from empty", () => {
    const ticket = makeTicket({ customFields: {} });
    const draft = makeTicket({ customFields: { cf1: "US" } });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0].from).toBe("—");
    expect(changes[0].to).toBe("US");
  });

  it("detects multiple changes at once", () => {
    const ticket = makeTicket();
    const draft = makeTicket({
      name: "Changed",
      priority: "critical",
      assigneeId: "u2",
      tagIds: ["t2", "t3"],
    });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(4);
    expect(changes.map((c) => c.field)).toEqual([
      "ticketDetail.name",
      "ticketDetail.priority",
      "ticketDetail.assignee",
      "ticketDetail.tags",
    ]);
  });

  it("shows dash for null/missing lookup IDs", () => {
    const ticket = makeTicket({ projectId: null, categoryId: null });
    const draft = makeTicket({ projectId: "p1", categoryId: null });
    const changes = getTicketChanges(ticket, draft, baseLookups);
    expect(changes).toHaveLength(1);
    expect(changes[0].from).toBe("—");
    expect(changes[0].to).toBe("Project A");
  });
});
