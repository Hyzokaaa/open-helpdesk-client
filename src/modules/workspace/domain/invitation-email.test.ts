import { describe, expect, it } from "vitest";
import { describeEmailFailures, describeResendFailure, listEmails } from "./invitation-email";

const texts: Record<string, string> = {
  "invitations.emailFailure.created.one": "The invitation to {email} was created, but the email could not be sent",
  "invitations.emailFailure.created.other": "{count} invitations were created, but the emails could not be sent",
  "invitations.emailFailure.renewed": "The invitation to {email} was renewed, but the email could not be sent",
  "invitations.emailFailure.noService.one": "The invitation to {email} was created. No mail server.",
  "invitations.emailFailure.noService.other": "{count} invitations were created. No mail server.",
  "invitations.emailFailure.renewedNoService": "The invitation to {email} was renewed. No mail server.",
  "invitations.emailFailure.action.one": "Copy the link.",
  "invitations.emailFailure.action.other": "Copy the links.",
  "invitations.emailFailure.because": "the {via} {reason}",
  "invitations.emailFailure.noDetail": "no reason given",
  "invitations.emailReason.auth-failed": "rejected the username or password",
  "invitations.emailReason.refused": "refused the connection",
  "invitations.emailVia.workspace": "workspace mail server",
  "invitations.emailVia.global": "installation mail server",
  "invitations.andMore": "and {count} more",
};
const t = (key: string) => texts[key] ?? key;

const refused = { reason: "send-failed" as const, via: "workspace" as const, code: "refused", detail: "connect ECONNREFUSED ::1:1025" };

describe("describeEmailFailures", () => {
  it("names a single invitation in the sentence and keeps the server's words apart", () => {
    expect(describeEmailFailures([{ ...refused, email: "a@x.com" }], t)).toEqual([{
      reason: "send-failed",
      headline: "The invitation to a@x.com was created, but the email could not be sent: the workspace mail server refused the connection.",
      action: "Copy the link.",
      detail: "connect ECONNREFUSED ::1:1025",
    }]);
  });

  it("counts several invitations that failed for the same reason", () => {
    const [message] = describeEmailFailures([{ ...refused, email: "a@x.com" }, { ...refused, email: "b@x.com" }], t);
    expect(message.headline).toBe("2 invitations were created, but the emails could not be sent: the workspace mail server refused the connection.");
    expect(message.action).toBe("Copy the links.");
  });

  it("says there is no mail server when the send was only simulated, with nothing technical to add", () => {
    expect(describeEmailFailures([{ reason: "no-email-service", email: "a@x.com" }], t)).toEqual([{
      reason: "no-email-service", headline: "The invitation to a@x.com was created. No mail server.", action: "Copy the link.", detail: null,
    }]);
  });

  it("leaves an unrecognised failure to the server's words", () => {
    const [message] = describeEmailFailures([{ reason: "send-failed", via: "global", code: "unknown", detail: "Unexpected socket close", email: "a@x.com" }], t);
    expect(message.headline).toBe("The invitation to a@x.com was created, but the email could not be sent.");
    expect(message.detail).toBe("Unexpected socket close");
  });

  it("still says something when the server gave no reason", () => {
    const [message] = describeEmailFailures([{ reason: "send-failed", via: "global", email: "a@x.com" }], t);
    expect(message.detail).toBe("no reason given");
  });
});

describe("describeResendFailure", () => {
  it("says the invitation was renewed and where its new link is", () => {
    expect(describeResendFailure(refused, "a@x.com", "Link copied.", t)).toEqual({
      reason: "send-failed",
      headline: "The invitation to a@x.com was renewed, but the email could not be sent: the workspace mail server refused the connection.",
      action: "Link copied.",
      detail: "connect ECONNREFUSED ::1:1025",
    });
    expect(describeResendFailure({ reason: "no-email-service" }, "a@x.com", "Link copied.", t).headline).toBe("The invitation to a@x.com was renewed. No mail server.");
  });
});

describe("listEmails", () => {
  it("lists a few addresses in full", () => {
    expect(listEmails(["a@x.com", "b@x.com", "c@x.com"], t)).toBe("a@x.com, b@x.com, c@x.com");
  });

  it("shortens a long list to the first three and how many more", () => {
    expect(listEmails(["p1@x", "p2@x", "p3@x", "p4@x", "p5@x"], t)).toBe("p1@x, p2@x, p3@x and 2 more");
  });
});
