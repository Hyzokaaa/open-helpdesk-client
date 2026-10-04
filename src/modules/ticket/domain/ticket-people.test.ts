import { describe, expect, it } from "vitest";
import { collectTicketPeople, findPerson } from "./ticket-people";

const ana = { id: "u-ana", firstName: "Ana", lastName: "Diaz" };
const bob = { id: "u-bob", firstName: "Bob", lastName: "Ruiz" };

describe("ticket people", () => {
  it("collects the names the ticket and its comments carry", () => {
    const people = collectTicketPeople({
      ticket: { reporter: ana, assignee: null, registeredBy: undefined },
      comments: [{ author: bob }, { author: null }, {}],
    });
    expect([...people.keys()].sort()).toEqual(["u-ana", "u-bob"]);
  });

  it("names someone the caller cannot see in the member list", () => {
    const people = collectTicketPeople({ ticket: { reporter: ana } });
    expect(findPerson("u-ana", [], people)).toEqual(ana);
    expect(findPerson("u-unknown", [], people)).toBeUndefined();
  });

  it("prefers the member entry, which carries the avatar", () => {
    const member = { userId: "u-ana", firstName: "Ana", lastName: "Diaz", avatarUrl: "a.png" };
    expect(findPerson("u-ana", [member], collectTicketPeople({ ticket: { reporter: ana } }))).toBe(member);
  });
});
