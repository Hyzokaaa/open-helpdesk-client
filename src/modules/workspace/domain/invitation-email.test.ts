import { describe, expect, it } from "vitest";
import { describeEmailFailures } from "./invitation-email";

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
});
