import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import { STATUS_COLORS, PRIORITY_COLORS } from "../domain/ticket-enums";
import type { TicketDetail } from "../services/ticket.service";
import type { Draft } from "../hooks/useTicketEdit";
import type { TicketCategoryDto } from "@modules/project/services/project.service";

interface TicketDetailHeaderProps {
  ticket: TicketDetail;
  draft: Draft | null;
  setDraft: React.Dispatch<React.SetStateAction<Draft | null>>;
  isEditing: boolean;
  canSwitchToEdit: boolean;
  canEditName: boolean;
  canEditFields: boolean;
  wsCategories: TicketCategoryDto[];
  saving: boolean;
  embedded?: boolean;
  enterEdit: () => void;
  cancelEdit: () => void;
  requestSave: () => void;
  t: (key: any) => string;
  tEnum: (prefix: string, value: string) => string;
}

export default function TicketDetailHeader({
  ticket, draft, setDraft,
  isEditing, canSwitchToEdit, canEditName, canEditFields,
  wsCategories, saving, embedded,
  enterEdit, cancelEdit, requestSave,
  t, tEnum,
}: TicketDetailHeaderProps) {
  return (
    <>
      {/* Sticky bar. When embedded in a Sheet it breaks out of the sheet padding so the
          border spans edge to edge and the sheet's own close button lands inside it. */}
      <div
        className={`sticky top-0 z-10 flex items-center gap-3 bg-surface border-b border-border-card ${
          embedded ? "-mx-6 -mt-4 px-6 pt-4 pb-3" : "pb-3"
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

        <div className={`flex items-center gap-2 shrink-0 ${embedded ? "pr-10" : ""}`}>
          {isEditing ? (
            <>
              <Button size="xs" color="light" onClick={cancelEdit}>{t("ticketDetail.cancel")}</Button>
              <Button size="xs" color="primary" onClick={requestSave} loading={saving}>{t("ticketDetail.save")}</Button>
            </>
          ) : canSwitchToEdit ? (
            <Button size="xs" onClick={enterEdit}>{t("ticketDetail.edit")}</Button>
          ) : null}
        </div>
      </div>

      <div className="mb-6">
        {!isEditing && (
          <div className="flex items-center gap-2 mt-3">
            <StatusBadge
              label={tEnum("status", ticket.status)}
              color={STATUS_COLORS[ticket.status] || "gray"}
            />
            <StatusBadge
              label={tEnum("priority", ticket.priority)}
              color={PRIORITY_COLORS[ticket.priority] || "gray"}
            />
            {(() => { const cat = wsCategories.find((c) => c.id === ticket.categoryId); return <StatusBadge label={cat?.name ?? "—"} color={(cat?.color as any) || "primary"} size="xs" />; })()}
          </div>
        )}
      </div>
    </>
  );
}
