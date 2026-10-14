import { describe, expect, it } from "vitest";
import { describeTicketActivity } from "./describe-ticket-activity";

const t = (key: string) => key.split(".").pop()!;
const added = (metadata: Record<string, unknown>) => describeTicketActivity({ action: "participant-added", metadata }, t);

describe("describeTicketActivity, followers", () => {
  it("names who was added by hand, without the email", () => {
    expect(added({ target: "Sara Test (sara@acme.test)", role: "follower" })).toBe("addedParticipant Sara Test asFollower");
  });

  it("says the author started following when they commented", () => {
    expect(added({ target: "Ana Test (ana@acme.test)", role: "follower", reason: "comment" })).toBe("startedFollowing");
  });

  it("says why when a mention or a transfer offer added them", () => {
    expect(added({ target: "Sara Test (sara@acme.test)", role: "follower", reason: "mention" })).toBe("addedParticipant Sara Test asFollower byMention");
    expect(added({ target: "Leo Test (leo@acme.test)", role: "follower", reason: "transfer-request" })).toBe("addedParticipant Leo Test asFollower byTransferRequest");
  });
});
