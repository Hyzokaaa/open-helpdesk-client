import { describe, expect, it } from "vitest";
import { buildTicketTimeline, type TimelineActivity } from "./build-ticket-timeline";

const at = (minutes: number) => new Date(Date.UTC(2026, 9, 12, 9, 0) + minutes * 60_000).toISOString();
const act = (id: string, action: string, userId: string | null, minutes: number, extra: Partial<TimelineActivity> = {}): TimelineActivity =>
  ({ id, action, userId, createdAt: at(minutes), ...extra });

const ticket = { reporterId: "carla", createdAt: at(0) };

describe("buildTicketTimeline", () => {
  it("opens with the ticket, with the files it came with and how it arrived", () => {
    const [opening] = buildTicketTimeline({
      ticket,
      comments: [],
      files: [{ id: "f1", commentId: null, createdAt: at(0), uploadedBy: { id: "carla" } }],
      activity: [act("a1", "ticket-created", "carla", 0, { source: "email" })],
    });
    expect(opening).toMatchObject({ kind: "opening", authorId: "carla", via: "email" });
    expect(opening.kind === "opening" && opening.files.map((f) => f.id)).toEqual(["f1"]);
  });

  it("interleaves comments and changes by time, leaving out what the comments already tell", () => {
    const timeline = buildTicketTimeline({
      ticket,
      comments: [{ id: "c1", authorId: "ana", createdAt: at(30) }, { id: "c2", authorId: "carla", createdAt: at(90) }],
      files: [{ id: "f2", commentId: "c1", createdAt: at(30), uploadedBy: { id: "ana" } }],
      activity: [
        act("a1", "ticket-created", "carla", 0),
        act("a2", "ticket-assigned", "ana", 10),
        act("a3", "comment-created", "ana", 30),
        act("a4", "ticket-status-changed", "ana", 60),
        act("a5", "attachment-uploaded", "ana", 30),
      ],
    });
    expect(timeline.map((e) => e.kind)).toEqual(["opening", "changes", "comment", "changes", "comment"]);
    const comment = timeline[2];
    expect(comment.kind === "comment" && comment.files.map((f) => f.id)).toEqual(["f2"]);
  });

  it("joins changes by the same person a few minutes apart into one line", () => {
    const timeline = buildTicketTimeline({
      ticket,
      comments: [],
      files: [],
      activity: [
        act("a1", "ticket-assigned", "ana", 5),
        act("a2", "ticket-status-changed", "ana", 6),
        act("a3", "ticket-updated", "ana", 14),
        act("a4", "participant-added", "sara", 15),
        act("a5", "ticket-updated", "ana", 40),
      ],
    });
    const lines = timeline.filter((e) => e.kind === "changes").map((e) => e.kind === "changes" && e.items.map((i) => i.id));
    expect(lines).toEqual([["a1", "a2", "a3"], ["a4"], ["a5"]]);
  });

  it("does not join changes across a comment", () => {
    const timeline = buildTicketTimeline({
      ticket,
      comments: [{ id: "c1", authorId: "carla", createdAt: at(6) }],
      files: [],
      activity: [act("a1", "ticket-assigned", "ana", 5), act("a2", "ticket-status-changed", "ana", 7)],
    });
    expect(timeline.map((e) => e.kind)).toEqual(["opening", "changes", "comment", "changes"]);
  });

  it("shows a file added to the ticket later as its own entry, with who added it", () => {
    const timeline = buildTicketTimeline({
      ticket,
      comments: [],
      files: [
        { id: "late1", commentId: null, createdAt: at(120), uploadedBy: { id: "ana" } },
        { id: "late2", commentId: null, createdAt: at(121), uploadedBy: { id: "ana" } },
      ],
      activity: [],
    });
    expect(timeline[1]).toMatchObject({ kind: "files", authorId: "ana" });
    expect(timeline[1].kind === "files" && timeline[1].files.map((f) => f.id)).toEqual(["late1", "late2"]);
  });
});
