import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import { P } from "@modules/workspace/domain/permissions";

interface TicketBulkActionsProps {
  selectedCount: number;
  can: (permission: string) => boolean;
  onChangeStatus: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export default function TicketBulkActions({
  selectedCount,
  can,
  onChangeStatus,
  onDelete,
  onClear,
}: TicketBulkActionsProps) {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 ml-auto">
      <span className="text-xs text-body font-body-semibold">
        {selectedCount} {t("tickets.selected")}
      </span>
      {can(P.TICKET_CHANGE_STATUS) && (
        <Button size="xs" color="light" onClick={onChangeStatus}>
          {t("tickets.changeStatus")}
        </Button>
      )}
      {can(P.TICKET_DELETE) && (
        <Button size="xs" color="danger" onClick={onDelete}>
          {t("tickets.delete")}
        </Button>
      )}
      <button
        onClick={onClear}
        className="text-xs text-subtle hover:text-body cursor-pointer"
      >
        ✕
      </button>
    </div>
  );
}
