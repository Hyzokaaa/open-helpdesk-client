import { describe, expect, it } from "vitest";
import { mentionCandidates, ticketMentionIds } from "./mention-candidates";

const member = (userId: string, firstName: string, role = "agent") => ({ userId, firstName, lastName: "", role });
const team = [member("ana", "Ana"), member("bob", "Bob"), member("eva", "Eva", "admin"), member("carla", "Carla", "user"), member("dani", "Dani", "user")];
const names = (list: { firstName: string }[]) => list.map((m) => m.firstName);

describe("The people the @ popup offers", () => {
  it("offers only the ticket's people before anything is typed, in the ticket's order", () => {
    expect(names(mentionCandidates(team, ["eva", "carla", "bob"], ""))).toEqual(["Eva", "Carla", "Bob"]);
  });

  it("puts the ticket's people first while typing, then the rest of the team", () => {
    expect(names(mentionCandidates(team, ["eva"], "a"))).toEqual(["Eva", "Ana"]);
  });

  it("offers a customer only when they are on the ticket", () => {
    expect(names(mentionCandidates(team, [], "a"))).toEqual(["Ana", "Eva"]);
    expect(names(mentionCandidates(team, ["carla"], "a"))).toEqual(["Carla", "Ana", "Eva"]);
  });

  it("offers the team when nobody else is on the ticket", () => {
    expect(names(mentionCandidates(team, [], ""))).toEqual(["Ana", "Bob", "Eva"]);
  });

  it("offers eight at most", () => {
    const many = Array.from({ length: 12 }, (_, i) => member(`u${i}`, `Agent ${i}`));
    expect(mentionCandidates(many, [], "agent")).toHaveLength(8);
  });
});

describe("The ticket's people", () => {
  it("ranks the assignee, the requester, the followers and the latest writers, once each and without oneself", () => {
    expect(ticketMentionIds({
      assigneeId: "ana",
      reporterId: "carla",
      followerIds: ["bob", "ana"],
      commentAuthorIds: ["eva", "me", "dani", "eva"],
      selfId: "me",
    })).toEqual(["ana", "carla", "bob", "eva", "dani"]);
  });
});
