import { describe, expect, it } from "vitest";
import { describeEmailFailures, describeResendFailure, listEmails } from "./invitation-email";

const texts: Record<string, string> = {
  "invitations.emailFailure.noEmailService.one": "Created, not emailed: no mail server.",
  "invitations.emailFailure.noEmailService.other": "{count} created, not emailed: no mail server.",
  "invitations.emailFailure.sendFailed.one": "Created, but the {via} could not send it: {reason}.",
  "invitations.emailFailure.sendFailed.other": "{count} created, but the {via} could not send them: {reason}.",
  "invitations.emailFailure.detail": "(Detail: {detail})",
  "invitations.emailFailure.noDetail": "no reason given",
  "invitations.emailReason.auth-failed": "it refused the username or password",
  "invitations.emailReason.timeout": "it did not answer",
  "invitations.emailVia.workspace": "workspace server",
  "invitations.emailVia.global": "installation server",
  "invitations.emailFailure.resendFailed": "Renewed, but the {via} could not send it: {reason}.",
  "invitations.emailFailure.resentNoEmailService": "Renewed. No mail server.",
  "invitations.andMore": "and {count} more",
};
const t = (key: string) => texts[key] ?? key;

describe("describeEmailFailures", () => {
  it("says there is no mail server when the send was only simulated", () => {
    expect(describeEmailFailures([{ reason: "no-email-service" }], t)).toEqual(["Created, not emailed: no mail server."]);
  });

  it("explains a known failure in plain words and keeps the server's answer as detail", () => {
    expect(describeEmailFailures([{ reason: "send-failed", via: "workspace", code: "auth-failed", detail: "Invalid login: 535" }], t))
      .toEqual(["Created, but the workspace server could not send it: it refused the username or password. (Detail: Invalid login: 535)"]);
  });

  it("shows the server's own words when the failure has no plain explanation", () => {
    expect(describeEmailFailures([{ reason: "send-failed", via: "global", code: "unknown", detail: "Unexpected socket close" }], t))
      .toEqual(["Created, but the installation server could not send it: Unexpected socket close."]);
  });

  it("joins invitations failing for the same reason into one plural line", () => {
    const refused = { reason: "send-failed" as const, via: "global" as const, code: "timeout", detail: "Connection timeout" };
    expect(describeEmailFailures([refused, refused, { reason: "no-email-service" }, { reason: "no-email-service" }], t)).toEqual([
      "2 created, but the installation server could not send them: it did not answer. (Detail: Connection timeout)",
      "2 created, not emailed: no mail server.",
    ]);
  });

  it("still says something when the server gave no reason", () => {
    expect(describeEmailFailures([{ reason: "send-failed", via: "global" }], t)).toEqual(["Created, but the installation server could not send it: no reason given."]);
  });

  it("says a failed resend renewed the invitation and where its new link is", () => {
    expect(describeResendFailure({ reason: "send-failed", via: "workspace", code: "timeout", detail: "Connection timeout" }, "Link copied.", t))
      .toBe("Renewed, but the workspace server could not send it: it did not answer. Link copied. (Detail: Connection timeout)");
    expect(describeResendFailure({ reason: "no-email-service" }, "Link copied.", t)).toBe("Renewed. No mail server. Link copied.");
  });

  it("names the address a failure affects when it is only one, and counts them otherwise", () => {
    const refused = { reason: "send-failed" as const, via: "global" as const, code: "timeout", detail: "Connection timeout" };
    expect(describeEmailFailures([{ ...refused, email: "a@x.com" }], t))
      .toEqual(["a@x.com: Created, but the installation server could not send it: it did not answer. (Detail: Connection timeout)"]);
    expect(describeEmailFailures([{ ...refused, email: "a@x.com" }, { ...refused, email: "b@x.com" }], t))
      .toEqual(["2 created, but the installation server could not send them: it did not answer. (Detail: Connection timeout)"]);
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
