/** Why an invitation email did not leave, as the backend reports it next to `emailSent`. */
export interface InvitationEmailFailure {
  reason: "no-email-service" | "send-failed";
  detail?: string;
  /** Kind of failure (`connectionErrorKind` in the backend) */
  code?: string;
  via?: "workspace" | "global";
}

/** A failure notice in three parts: what happened, what to do, and the server's words for whoever digs further */
export interface EmailFailureMessage {
  reason: InvitationEmailFailure["reason"];
  headline: string;
  action: string;
  detail: string | null;
}

type Translate = (key: any) => string;

/** Failure kinds with a plain explanation; anything else shows only the server's own words as detail */
const EXPLAINED_CODES = new Set([
  "auth-failed", "tls-mismatch", "tls-required", "wrong-port", "host-not-found", "refused", "timeout", "certificate",
]);

/**
 * One notice per distinct reason, so ten invitations refused by the same server read as one message
 * and the inviter learns what to fix instead of only that "the link must be shared manually".
 * A single invitation is named in the sentence; several are only counted, the invitations page lists them.
 */
export function describeEmailFailures(failures: (InvitationEmailFailure & { email?: string })[], t: Translate): EmailFailureMessage[] {
  return group(failures).map(({ failure, count, emails }) => {
    const plural = count === 1 ? "one" : "other";
    return describe(failure, t, {
      created: t(`invitations.emailFailure.created.${plural}`).replace("{count}", String(count)).replace("{email}", emails[0] ?? ""),
      noService: t(`invitations.emailFailure.noService.${plural}`).replace("{count}", String(count)).replace("{email}", emails[0] ?? ""),
      action: t(`invitations.emailFailure.action.${plural}`),
    });
  });
}

/**
 * A resend that did not leave: the invitation was renewed rather than created, and `linkNote` says
 * where its new link is, since the one shared before stopped working.
 */
export function describeResendFailure(failure: InvitationEmailFailure, email: string, linkNote: string, t: Translate): EmailFailureMessage {
  return describe(failure, t, {
    created: t("invitations.emailFailure.renewed").replace("{email}", email),
    noService: t("invitations.emailFailure.renewedNoService").replace("{email}", email),
    action: linkNote,
  });
}

/** "a@x.com, b@x.com, c@x.com and 2 more": enough to recognise who without a wall of addresses */
export function listEmails(emails: string[], t: Translate, shown = 3): string {
  if (emails.length <= shown) return emails.join(", ");
  return `${emails.slice(0, shown).join(", ")} ${t("invitations.andMore").replace("{count}", String(emails.length - shown))}`;
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

function describe(
  failure: InvitationEmailFailure,
  t: Translate,
  texts: { created: string; noService: string; action: string },
): EmailFailureMessage {
  if (failure.reason === "no-email-service") {
    return { reason: failure.reason, headline: texts.noService, action: texts.action, detail: null };
  }

  // "…could not be sent: the workspace mail server refused the connection."
  const explained = !!failure.code && EXPLAINED_CODES.has(failure.code);
  const because = explained
    ? t("invitations.emailFailure.because")
        .replace("{via}", t(failure.via === "workspace" ? "invitations.emailVia.workspace" : "invitations.emailVia.global"))
        .replace("{reason}", t(`invitations.emailReason.${failure.code}`))
    : null;
  return {
    reason: failure.reason,
    headline: because ? `${texts.created}: ${because}.` : `${texts.created}.`,
    action: texts.action,
    detail: failure.detail || (explained ? null : t("invitations.emailFailure.noDetail")),
  };
}
