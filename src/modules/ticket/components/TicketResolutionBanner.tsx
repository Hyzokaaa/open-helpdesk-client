import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import type { TicketDetail } from "../services/ticket.service";
import { isClosedStatus } from "../domain/ticket-reopen";

interface Props {
  ticket: TicketDetail;
  /** Names a person by id, for when the ticket does not carry the summary. */
  nameOf: (userId: string | null) => string | null;
  /** The requester wrote after it was resolved: the team decides whether to reopen. */
  repliedAfterResolving: boolean;
  /** Offered with the late reply, when the viewer may reopen. */
  onReopen?: () => void;
}

const personName = (p?: { firstName?: string; lastName?: string } | null) => (p ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || null : null);

/**
 * Under the ticket header: who resolved it (and whether they said anything), or, after a
 * reopen, who reopened it, why, and who had resolved it. It comes from the ticket itself, so it
 * shows on every plan, unlike the activity tab.
 */
export default function TicketResolutionBanner({ ticket, nameOf, repliedAfterResolving, onReopen }: Props) {
  const { t, tEnum } = useTranslation();
  const formatDate = useFormatDate();
  const reopen = ticket.lastReopen;

  if (isClosedStatus(ticket.status)) {
    const resolver = personName(ticket.resolvedBy) ?? nameOf(ticket.resolvedById);
    if (ticket.status !== "resolved" || !resolver) return null;
    return (
      <div className="mb-3 space-y-2">
        <p className="text-sm text-secondary-text bg-surface-hover border border-border-card rounded-lg px-3 py-2">
          {t("resolution.resolvedBy").replace("{name}", resolver)}
          {ticket.resolvedAt && <> {t("resolution.on").replace("{date}", formatDate(ticket.resolvedAt))}</>}
          {ticket.resolvedWithComment === false && <> · <span className="text-amber-800 dark:text-amber-300">{t("reopen.noClosingComment")}</span></>}
        </p>
        {repliedAfterResolving && (
          <p role="status" className="flex flex-wrap items-center gap-2 text-sm bg-amber-50 text-amber-900 border border-amber-200 rounded-lg px-3 py-2 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800">
            {t("resolution.repliedAfter").replace("{name}", personName(ticket.reporter) ?? nameOf(ticket.reporterId) ?? "")}
            {onReopen && (
              <button type="button" onClick={onReopen} className="font-body-semibold underline cursor-pointer">
                {t("reopen.action")}
              </button>
            )}
          </p>
        )}
      </div>
    );
  }

  if (!reopen || !ticket.reopenCount) return null;
  const by = personName(reopen.by) ?? nameOf(reopen.byId) ?? "";
  const previous = personName(reopen.previousResolvedBy) ?? nameOf(reopen.previousResolvedById);
  return (
    <div className="mb-3 text-sm bg-amber-50 text-amber-900 border border-amber-200 rounded-lg px-3 py-2 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800">
      <p>
        {t("resolution.reopenedBy").replace("{name}", by)} {t("resolution.on").replace("{date}", formatDate(reopen.at))}
        {previous && <> · {t("resolution.hadResolved").replace("{name}", previous)}{reopen.previousResolvedAt && <> {t("resolution.on").replace("{date}", formatDate(reopen.previousResolvedAt))}</>}</>}
      </p>
      <p className="mt-1">
        <span className="font-body-semibold">{t("resolution.reason")} · {tEnum("reopenReason", reopen.reason)}</span>
        {reopen.note && <>: <q className="italic">{reopen.note}</q></>}
      </p>
    </div>
  );
}
