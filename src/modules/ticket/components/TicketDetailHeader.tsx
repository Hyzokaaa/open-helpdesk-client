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
  canDiscard: boolean;
  canTransfer: boolean | null;
  /** The assignee may let go of their own ticket even without ticket.assign */
  canRelease: boolean;
  canDelete: boolean;
  /** A closed ticket the viewer may take back to work, with a reason. */
  canReopen?: boolean;
  onReopen?: () => void;
  enterEdit: () => void;
  cancelEdit: () => void;
  requestSave: () => void;
  onChangeStatus: () => void;
  onAssign: () => void;
  onPickup: () => void;
  onDiscard: () => void;
  onTransfer: () => void;
  onRelease: () => void;
  onDelete: () => void;
  onClose?: () => void;
  t: (key: any) => string;
}

export default function TicketDetailHeader({
  ticket, draft, setDraft,
  isEditing, canSwitchToEdit, canEditName,
  saving, embedded,
  canChangeStatusAction, canAssignAction, canPickup, canDiscard, canTransfer, canRelease, canDelete, canReopen, onReopen,
  enterEdit, cancelEdit, requestSave,
  onChangeStatus, onAssign, onPickup, onDiscard, onTransfer, onRelease, onDelete, onClose,
  t,
}: TicketDetailHeaderProps) {
  // Mirrors the ticket list action menu: operations with side effects beyond the record
  // live here, not as form fields.
  const menuItems: ActionMenuItem[] = [
    ...(canChangeStatusAction ? [{ label: t("tickets.changeStatus"), onClick: onChangeStatus }] : []),
    ...(canAssignAction ? [{ label: t("tickets.assign"), onClick: onAssign }] : []),
    ...(canPickup ? [{ label: t("tickets.pickup"), onClick: onPickup }] : []),
    ...(canDiscard ? [{ label: t("tickets.discard"), onClick: onDiscard, danger: true }] : []),
    ...(canTransfer ? [{ label: t("tickets.transfer"), onClick: onTransfer }] : []),
    ...(canRelease ? [{ label: t("ticketDetail.release"), onClick: onRelease }] : []),
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
            <span className="text-muted font-body-medium">{ticket.ticketNumber}</span> {ticket.name}
            {!!ticket.reopenCount && (
              <span
                title={t("reopen.badgeTitle").replace("{count}", String(ticket.reopenCount))}
                className="ml-2 align-middle inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-body-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
              >
                <span aria-hidden="true">↺</span>{t("reopen.badge").replace("{count}", String(ticket.reopenCount))}
              </span>
            )}
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

        {/* In sight, not in the menu: serious, though not destructive like Delete */}
        {!isEditing && canReopen && onReopen && (
          <button
            type="button"
            onClick={onReopen}
            className="px-2.5 py-1 rounded-md text-xs font-body-semibold border border-amber-600 text-amber-800 hover:bg-amber-50 cursor-pointer dark:text-amber-300 dark:hover:bg-amber-950/40"
          >
            ↺ {t("reopen.action")}
          </button>
        )}

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
