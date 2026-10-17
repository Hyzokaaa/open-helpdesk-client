import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import useWorkspaceMembership from "../hooks/useWorkspaceMembership";

interface Props {
  workspaceSlug: string | undefined;
  /** Where the focus goes once joined, since this card disappears */
  onJoined?: () => void;
}

/** On the Members page: always shown while the system admin is not on the team, even with the bar hidden. */
export default function NotMemberCard({ workspaceSlug, onJoined }: Props) {
  const { t } = useTranslation();
  const { needsJoin, isUserRole, joining, failed, join } = useWorkspaceMembership(workspaceSlug);

  if (!needsJoin) return null;

  const onJoin = async () => {
    if (!(await join())) return;
    toast.success(t("membership.joined"));
    onJoined?.();
  };

  return (
    <section aria-labelledby="not-member-card-title" className="bg-surface-hover rounded-lg p-3 mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p id="not-member-card-title" className="text-sm font-body-semibold text-heading">
          {t(isUserRole ? "membership.cardTitleUser" : "membership.cardTitle")}
        </p>
        <p className="text-xs text-body">{t(isUserRole ? "membership.cardTextUser" : "membership.cardText")}</p>
        {failed && <p role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1">{t("membership.joinError")}</p>}
      </div>
      <Button size="sm" color="primary" onClick={onJoin} disabled={joining} aria-busy={joining}>
        {joining ? t("membership.joining") : failed ? t("membership.retry") : t(isUserRole ? "membership.makeAdmin" : "membership.join")}
      </Button>
    </section>
  );
}
