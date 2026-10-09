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
export function describeEmailFailures(failures: InvitationEmailFailure[], t: Translate): string[] {
  const groups = new Map<string, { failure: InvitationEmailFailure; count: number }>();
  for (const failure of failures) {
    const key = `${failure.reason}|${failure.via ?? ""}|${failure.code ?? ""}|${failure.detail ?? ""}`;
    const group = groups.get(key);
    if (group) group.count++;
    else groups.set(key, { failure, count: 1 });
  }

  return [...groups.values()].map(({ failure, count }) => {
    const plural = count === 1 ? "one" : "other";
    if (failure.reason === "no-email-service") {
      return t(`invitations.emailFailure.noEmailService.${plural}`).replace("{count}", String(count));
    }

    const explained = failure.code && EXPLAINED_CODES.has(failure.code);
    const reason = explained
      ? t(`invitations.emailReason.${failure.code}`)
      : failure.detail || t("invitations.emailFailure.noDetail");
    const line = t(`invitations.emailFailure.sendFailed.${plural}`)
      .replace("{count}", String(count))
      .replace("{via}", t(failure.via === "workspace" ? "invitations.emailVia.workspace" : "invitations.emailVia.global"))
      .replace("{reason}", reason);
    return explained && failure.detail
      ? `${line} ${t("invitations.emailFailure.detail").replace("{detail}", failure.detail)}`
      : line;
  });
}
