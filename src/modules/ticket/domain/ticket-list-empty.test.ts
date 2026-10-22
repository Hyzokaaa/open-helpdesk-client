import { describe, expect, it } from "vitest";
import { ticketListEmpty } from "./ticket-list-empty";

describe("ticketListEmpty", () => {
  it("a new workspace, with no filters, is empty and offers to create a ticket", () => {
    expect(ticketListEmpty({ activeFilterCount: 0 })).toBe("empty");
    expect(ticketListEmpty({ activeFilterCount: 0, search: "" })).toBe("empty");
  });

  it("a filter (statuses included) or a search that matches nothing offers to clear it", () => {
    expect(ticketListEmpty({ activeFilterCount: 1 })).toBe("no-results");
    expect(ticketListEmpty({ activeFilterCount: 0, search: "printer" })).toBe("no-results");
    expect(ticketListEmpty({ activeFilterCount: 2, projectId: "p1" })).toBe("no-results");
  });

  it("a project without tickets is just an empty view", () => {
    expect(ticketListEmpty({ activeFilterCount: 0, projectId: "p1" })).toBe("view");
  });
});
