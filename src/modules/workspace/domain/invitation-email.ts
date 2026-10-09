/** Why an invitation email did not leave, as the backend reports it next to `emailSent`. */
export interface InvitationEmailFailure {
  reason: "no-email-service" | "send-failed";
  detail?: string;
  /** Kind of failure (`connectionErrorKind` in the backend) */
  code?: string;
  via?: "workspace" | "global";
}

type Translate = (key: any) => string;

/** Failure kinds with a plain explanation; anything else shows the server's own words */
const EXPLAINED_CODES = new Set([
  "auth-failed", "tls-mismatch", "tls-required", "wrong-port", "host-not-found", "refused", "timeout", "certificate",
]);

/**
 * One line per distinct reason, so ten invitations refused by the same server read as one message
 * and the inviter learns what to fix instead of only that "the link must be shared manually".
 */
export function describeEmailFailures(failures: (InvitationEmailFailure & { email?: string })[], t: Translate): string[] {
  return group(failures).map(({ failure, count, emails }) => {
    const line = describe(failure, count, t, "created");
    // One address is named; several are only counted, the invitations page lists them
    return emails.length === 1 ? `${emails[0]}: ${line}` : line;
  });
}

/** "a@x.com, b@x.com, c@x.com and 2 more": enough to recognise who without a wall of addresses */
export function listEmails(emails: string[], t: Translate, shown = 3): string {
  if (emails.length <= shown) return emails.join(", ");
  return `${emails.slice(0, shown).join(", ")} ${t("invitations.andMore").replace("{count}", String(emails.length - shown))}`;
}

/**
 * A resend that did not leave: the invitation was renewed rather than created, and `linkNote` says
 * where its new link is, since the one shared before stopped working.
 */
export function describeResendFailure(failure: InvitationEmailFailure, linkNote: string, t: Translate): string {
  return describe(failure, 1, t, "resent", linkNote);
}

function group(failures: (InvitationEmailFailure & { email?: string })[]) {
  const groups = new Map<string, { failure: InvitationEmailFailure; count: number; emails: string[] }>();
  for (const failure of failures) {
    const key = `${failure.reason}|${failure.via ?? ""}|${failure.code ?? ""}|${failure.detail ?? ""}`;
    const group = groups.get(key) ?? { failure, count: 0, emails: [] };
    group.count++;
    if (failure.email) group.emails.push(failure.email);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function describe(failure: InvitationEmailFailure, count: number, t: Translate, mode: "created" | "resent", linkNote?: string): string {
  const plural = count === 1 ? "one" : "other";
  if (failure.reason === "no-email-service") {
    return mode === "resent"
      ? `${t("invitations.emailFailure.resentNoEmailService")} ${linkNote ?? ""}`.trim()
      : t(`invitations.emailFailure.noEmailService.${plural}`).replace("{count}", String(count));
  }

  const explained = failure.code && EXPLAINED_CODES.has(failure.code);
  const reason = explained
    ? t(`invitations.emailReason.${failure.code}`)
    : failure.detail || t("invitations.emailFailure.noDetail");
  const sentence = mode === "resent" ? "invitations.emailFailure.resendFailed" : `invitations.emailFailure.sendFailed.${plural}`;
  const line = [
    t(sentence)
      .replace("{count}", String(count))
      .replace("{via}", t(failure.via === "workspace" ? "invitations.emailVia.workspace" : "invitations.emailVia.global"))
      .replace("{reason}", reason),
    linkNote,
    explained && failure.detail ? t("invitations.emailFailure.detail").replace("{detail}", failure.detail) : null,
  ];
  return line.filter(Boolean).join(" ");
}
