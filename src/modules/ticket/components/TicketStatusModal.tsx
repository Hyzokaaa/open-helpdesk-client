import Button from "@modules/app/modules/ui/components/Button/Button";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import { STATUSES } from "../domain/ticket-enums";

interface Props {
  /** Shown under the title: a ticket name, or a count for bulk changes. */
  subtitle: string;
  selected: string;
  currentStatus?: string;
  onSelect: (status: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  t: (key: any) => string;
  tEnum: (prefix: string, value: string) => string;
}

export default function TicketStatusModal({
  subtitle, selected, currentStatus, onSelect, onConfirm, onClose, t, tEnum,
}: Props) {
  return (
    <Sheet size="sm" onClose={onClose}>
      <h3 className="text-base font-body-bold text-heading mb-1">{t("tickets.changeStatus")}</h3>
      <p className="text-sm text-muted mb-4">{subtitle}</p>
      <div className="flex flex-col gap-1.5 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-body-medium transition-colors cursor-pointer ${
              selected === s
                ? "bg-surface-active text-primary border border-primary/30"
                : "text-secondary-text hover:bg-surface-hover border border-transparent"
            }`}
          >
            {tEnum("status", s)}
          </button>
        ))}
      </div>
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
