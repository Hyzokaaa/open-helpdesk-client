import { toast } from "react-toastify";
import { EmailFailureMessage } from "../domain/invitation-email";

type Translate = (key: any) => string;

/** What happened first, then what to do, then the server's words smaller underneath */
function EmailFailureNotice({ message, t }: { message: EmailFailureMessage; t: Translate }) {
  return (
    <div className="space-y-1">
      <p className="font-body-semibold">{message.headline}</p>
      <p>{message.action}</p>
      {message.detail && (
        <p className="text-xs opacity-70 break-words">{t("connectionError.detail")}: {message.detail}</p>
      )}
    </div>
  );
}

/**
 * A failed send is a warning; a missing mail server is not something going wrong, only how this
 * installation is set up, so it reads as information.
 */
export function showEmailFailure(message: EmailFailureMessage, t: Translate): void {
  const content = <EmailFailureNotice message={message} t={t} />;
  if (message.reason === "send-failed") toast.warning(content, { autoClose: 12000 });
  else toast.info(content, { autoClose: 9000 });
}
