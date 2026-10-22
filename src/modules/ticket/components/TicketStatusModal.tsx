import Button from "@modules/app/modules/ui/components/Button/Button";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import { STATUSES } from "../domain/ticket-enums";
import { assignmentAfterStatus } from "../domain/ticket-assignment-rule";

interface Props {
  /** Shown under the title: a ticket name, or a count for bulk changes. */
  subtitle: string;
  selected: string;
  currentStatus?: string;
  /** Statuses to offer; every status by default. */
  statuses?: readonly string[];
  /** Heading; "Change status" by default. */
  title?: string;
  /** A closed ticket goes back to work only by reopening it, with a reason: offered here. */
  onReopen?: () => void;
  /** The ticket's assignee, to say what the chosen status does to it; left out, nothing is said. */
  assigneeId?: string | null;
  onSelect: (status: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  t: (key: any) => string;
  tEnum: (prefix: string, value: string) => string;
}

export default function TicketStatusModal({
  subtitle, selected, currentStatus, statuses = STATUSES, title, onReopen, assigneeId, onSelect, onConfirm, onClose, t, tEnum,
}: Props) {
  const assignment = assigneeId !== undefined && selected && selected !== currentStatus ? assignmentAfterStatus(selected, assigneeId) : null;
  return (
    <Sheet size="sm" onClose={onClose}>
      <h3 className="text-base font-body-bold text-heading mb-1">{title ?? t("tickets.changeStatus")}</h3>
      <p className="text-sm text-muted mb-4">{subtitle}</p>
      <div className="flex flex-col gap-1.5 mb-6">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-body-medium transition-colors cursor-pointer ${
              selected === s
                ? "bg-surface-active text-primary border border-primary/30"
                : "text-secondary-text hover:bg-surface-hover border border-transparent"
            }`}
          >
            {tEnum("status", s)}{s === currentStatus && <span className="text-muted font-body"> ({t("tickets.currentStatus")})</span>}
          </button>
        ))}
        {onReopen && (
          <button
            type="button"
            onClick={onReopen}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-body-medium border border-dashed border-amber-600 text-amber-800 hover:bg-amber-50 cursor-pointer dark:text-amber-300 dark:hover:bg-amber-950/40"
          >
            ↺ {t("reopen.actionEllipsis")} <span className="text-xs font-body text-muted">· {t("reopen.asksReason")}</span>
          </button>
        )}
      </div>
      {/* Status and assignee go together: said before it happens, not found out afterwards */}
      {assignment && (
        <p role="status" className="text-xs text-muted -mt-3 mb-5">
          {assignment === "takes" ? t("tickets.statusTakes") : t("tickets.statusLetsGo")}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button size="sm" color="light" onClick={onClose}>{t("ticketDetail.cancel")}</Button>
        <Button
          size="sm"
          color="primary"
          disabled={!selected || selected === currentStatus}
          onClick={onConfirm}
        >
          {t("ticketDetail.confirmSave")}
        </Button>
      </div>
    </Sheet>
  );
}
