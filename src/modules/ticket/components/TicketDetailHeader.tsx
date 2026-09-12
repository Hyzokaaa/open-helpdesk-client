import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import ActionMenu, { ActionMenuItem } from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
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
  canChangeStatusAction: boolean;
  canAssignAction: boolean;
  canPickup: boolean;
  canTransfer: boolean | null;
  canDelete: boolean;
  enterEdit: () => void;
  cancelEdit: () => void;
  requestSave: () => void;
  onChangeStatus: () => void;
  onAssign: () => void;
  onPickup: () => void;
  onTransfer: () => void;
  onDelete: () => void;
  onClose?: () => void;
  t: (key: any) => string;
}

export default function TicketDetailHeader({
  ticket, draft, setDraft,
  isEditing, canSwitchToEdit, canEditName,
  saving, embedded,
  canChangeStatusAction, canAssignAction, canPickup, canTransfer, canDelete,
  enterEdit, cancelEdit, requestSave,
  onChangeStatus, onAssign, onPickup, onTransfer, onDelete, onClose,
  t,
}: TicketDetailHeaderProps) {
  // Mirrors the ticket list action menu: operations with side effects beyond the record
  // live here, not as form fields.
  const menuItems: ActionMenuItem[] = [
    ...(canChangeStatusAction ? [{ label: t("tickets.changeStatus"), onClick: onChangeStatus }] : []),
    ...(canAssignAction ? [{ label: t("tickets.assign"), onClick: onAssign }] : []),
    ...(canPickup ? [{ label: t("tickets.pickup"), onClick: onPickup }] : []),
    ...(canTransfer ? [{ label: t("tickets.transfer"), onClick: onTransfer }] : []),
    ...(canDelete ? [{ label: t("ticketDetail.deleteTicket"), onClick: onDelete, danger: true }] : []),
  ];

  return (
    <div
      className={`sticky top-0 z-10 flex items-center gap-3 mb-2 ${
        embedded ? "-mx-6 -mt-4 px-6 py-3 bg-surface" : "py-3 bg-page"
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

        {!isEditing && <ActionMenu items={menuItems} />}

        {embedded && onClose && (
          <div className="ml-2">
            <SheetCloseButton onClick={onClose} />
          </div>
        )}
      </div>
    </div>
  );
}
