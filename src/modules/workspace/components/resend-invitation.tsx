import { toast } from "react-toastify";
import { describeResendFailure } from "../domain/invitation-email";
import { showEmailFailure } from "./EmailFailureNotice";
import { getInvitationLink, resendInvitation } from "../services/invitation.service";

type Translate = (key: any) => string;

/**
 * Resending gives the invitation a new link and seven more days. When no email carries that link,
 * the old one has just stopped working, so the new one goes to the clipboard to be shared by hand.
 */
export async function resendInvitationAndNotify(slug: string, invitation: { id: string; email: string }, t: Translate): Promise<void> {
  const result = await resendInvitation(slug, invitation.id);
  if (result.emailSent) {
    toast.success(`${t("invitations.resent")}: ${invitation.email}`);
    return;
  }

  let copied = true;
  try {
    await navigator.clipboard.writeText(await getInvitationLink(slug, invitation.id));
  } catch {
    copied = false;
  }
  const linkNote = t(copied ? "invitations.newLinkCopied" : "invitations.newLinkInMenu");
  const failure = result.emailFailure ?? { reason: "no-email-service" as const };
  showEmailFailure(describeResendFailure(failure, invitation.email, linkNote, t), t);
}
