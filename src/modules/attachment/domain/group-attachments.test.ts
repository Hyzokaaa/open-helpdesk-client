import { describe, it, expect } from "vitest";
import { groupAttachments, isAddedLater } from "./group-attachments";
import type { TicketAttachment } from "../services/attachment.service";

const file = (id: string, commentId: string | null): TicketAttachment => ({
  id, originalName: `${id}.png`, mimeType: "image/png", size: 10, downloadUrl: `https://x/${id}`,
  canDelete: false, commentId, createdAt: null, uploadedBy: null,
});

describe("groupAttachments", () => {
  it("puts each file with its comment and the rest with the ticket", () => {
    const { ticket, byComment } = groupAttachments(
      [file("a", null), file("b", "c-1"), file("c", "c-2"), file("d", "c-1")],
      ["c-1", "c-2"],
    );
    expect(ticket.map((f) => f.id)).toEqual(["a"]);
    expect(byComment.get("c-1")?.map((f) => f.id)).toEqual(["b", "d"]);
    expect(byComment.get("c-2")?.map((f) => f.id)).toEqual(["c"]);
  });

  it("tells the files added after the ticket was created from those it came with", () => {
    const at = (createdAt: string | null) => ({ ...file("x", null), createdAt });
    const created = "2026-10-10T08:00:00Z";
    expect(isAddedLater(at("2026-10-10T08:00:20Z"), created)).toBe(false);
    expect(isAddedLater(at("2026-10-10T11:30:00Z"), created)).toBe(true);
    expect(isAddedLater(at(null), created)).toBe(false);
    expect(isAddedLater(at("2026-10-10T11:30:00Z"), null)).toBe(false);
  });

  it("falls back to the ticket for a file whose comment is not shown", () => {
    const { ticket, byComment } = groupAttachments([file("orphan", "deleted-comment")], ["c-1"]);
    expect(ticket.map((f) => f.id)).toEqual(["orphan"]);
    expect(byComment.size).toBe(0);
  });
});
