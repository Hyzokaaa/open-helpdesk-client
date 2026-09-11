import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import { SheetCloseButton } from "@modules/app/modules/ui/components/Sheet/Sheet";
import type { TicketDetail } from "../services/ticket.service";
import type { Draft } from "../hooks/useTicketEdit";

interface TicketDetailHeaderProps {
  ticket: TicketDetail;
  draft: Draft | null;
  setDraft: React.Dispatch<React.SetStateAction<Draft | null>>;
  isEditing: boolean;
  canSwitchToEdit: boolean;
  canEditName: boolean;
  saving: boolean;
  embedded?: boolean;
  enterEdit: () => void;
  cancelEdit: () => void;
  requestSave: () => void;
  onClose?: () => void;
  t: (key: any) => string;
}

export default function TicketDetailHeader({
  ticket, draft, setDraft,
  isEditing, canSwitchToEdit, canEditName,
  saving, embedded,
  enterEdit, cancelEdit, requestSave, onClose,
  t,
}: TicketDetailHeaderProps) {
  return (
    <div
      className={`sticky top-0 z-10 flex items-center gap-3 bg-surface mb-6 ${
        embedded ? "-mx-6 -mt-4 px-6 py-4" : "py-2"
      }`}
    >
      <div className="min-w-0 flex-1">
        {isEditing && draft && canEditName ? (
          <Input
            value={draft.name}
            onChange={(v) => setDraft((d) => d ? { ...d, name: v } : d)}
            autoFocus
          />
        ) : (
          <h2 className="text-lg font-body-bold text-heading truncate">
            <span className="text-muted font-body-medium">#{ticket.ticketNumber}</span> {ticket.name}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isEditing ? (
          <>
            <Button size="xs" color="light" onClick={cancelEdit}>{t("ticketDetail.cancel")}</Button>
            <Button size="xs" color="primary" onClick={requestSave} loading={saving}>{t("ticketDetail.save")}</Button>
          </>
        ) : canSwitchToEdit ? (
          <Button size="xs" onClick={enterEdit}>{t("ticketDetail.edit")}</Button>
        ) : null}

        {embedded && onClose && (
          <div className="ml-2">
            <SheetCloseButton onClick={onClose} />
          </div>
        )}
      </div>
    </div>
  );
}
