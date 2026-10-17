import { useParams } from "react-router";
import { toast } from "react-toastify";
import useTranslation from "@modules/app/i18n/useTranslation";
import useWorkspaceMembership from "../hooks/useWorkspaceMembership";

interface Props {
  /** Referenced by the picker's aria-describedby, so screen readers read it with the list */
  id?: string;
  /** "follow" for the followers card, where there is no list to be missing from */
  variant?: "list" | "follow";
  /** Called once joined: the caller selects the user or focuses the next step. Nothing is done for them. */
  onJoined?: () => void;
  className?: string;
}

/** One quiet line where a system admin who is not on the team would expect to see themselves. */
export default function NotMemberHint({ id, variant = "list", onJoined, className = "" }: Props) {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { needsJoin, isUserRole, joining, failed, join } = useWorkspaceMembership(workspaceSlug);

  if (!needsJoin) return null;

  const text = variant === "follow"
    ? "membership.hintFollow"
    : isUserRole ? "membership.hintUser" : "membership.hint";

  const onJoin = async () => {
    if (!(await join())) return;
    toast.success(t(onJoined ? "membership.joinedSelected" : "membership.joined"));
    onJoined?.();
  };

  return (
    <p id={id} className={`text-exs text-muted ${className}`}>
      {failed ? <span role="alert" className="text-red-600 dark:text-red-400">{t("membership.joinError")}</span> : t(text)}{" "}
      <button
        type="button"
        onClick={onJoin}
        disabled={joining}
        aria-busy={joining}
        className="text-primary font-body-medium hover:underline disabled:opacity-60 cursor-pointer"
      >
        {joining ? t("membership.joining") : failed ? t("membership.retry") : t(isUserRole ? "membership.makeAdmin" : "membership.join")}
      </button>
    </p>
  );
}
