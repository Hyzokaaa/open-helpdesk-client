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
  enterEdit: () => void;
  cancelEdit: () => void;
  requestSave: () => void;
  t: (key: any) => string;
  tEnum: (prefix: string, value: string) => string;
}

export default function TicketDetailHeader({
  ticket, draft, setDraft,
  isEditing, canSwitchToEdit, canEditName, canEditFields,
  wsCategories, saving,
  enterEdit, cancelEdit, requestSave,
  t, tEnum,
}: TicketDetailHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-end mb-2 gap-2">
        {isEditing ? (
          <>
            <Button size="xs" color="light" onClick={cancelEdit}>{t("ticketDetail.cancel")}</Button>
            <Button size="xs" color="primary" onClick={requestSave} loading={saving}>{t("ticketDetail.save")}</Button>
          </>
        ) : canSwitchToEdit ? (
          <Button size="xs" onClick={enterEdit}>{t("ticketDetail.edit")}</Button>
        ) : null}
      </div>
      {isEditing && draft && canEditName ? (
        <Input
          value={draft.name}
          onChange={(v) => setDraft((d) => d ? { ...d, name: v } : d)}
          autoFocus
          size="lg"
        />
      ) : (
        <h2 className="text-lg font-body-bold text-heading"><span className="text-muted font-body-medium">#{ticket.ticketNumber}</span> {ticket.name}</h2>
      )}
      {!isEditing && (
        <div className="flex items-center gap-2 mt-2">
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
  );
}
