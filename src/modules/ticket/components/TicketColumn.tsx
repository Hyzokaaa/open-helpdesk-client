import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import useTranslation from "@modules/app/i18n/useTranslation";
import TicketCard from "./TicketCard";
import type { TicketListItem } from "../services/ticket.service";
import type { Tag } from "@modules/tag/services/tag.service";
import type { WorkspaceMember } from "@modules/workspace/services/workspace.service";
import type { TicketCategoryDto } from "@modules/project/services/project.service";

interface Props {
  status: string;
  label: string;
  tickets: TicketListItem[];
  tags: Tag[];
  members: WorkspaceMember[];
  categories: TicketCategoryDto[];
  onTicketClick: (ticketId: string) => void;
  tEnum: (ns: string, key: string) => string;
  blocked?: boolean;
  isTicketDisabled?: (ticket: TicketListItem) => boolean;
}

const BORDER_COLORS: Record<string, string> = {
  open: "border-l-yellow-500",
  pending: "border-l-gray-400",
  "in-progress": "border-l-blue-500",
  resolved: "border-l-green-500",
};

export default function TicketColumn({ status, label, tickets, tags, members, categories, onTicketClick, tEnum, blocked, isTicketDisabled }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const { t } = useTranslation();

  return (
    <div
      className={`relative flex flex-col min-w-[280px] flex-1 h-full rounded-lg border border-border-card bg-surface-hover/50 transition-all ${
        blocked ? "" : isOver ? "ring-2 ring-primary/50 bg-surface-hover" : ""
      }`}
    >
      {blocked && (
        <div className="absolute inset-0 bg-red-500/10 rounded-lg z-10 pointer-events-none" />
      )}

      <div className={`flex items-center justify-between px-3 py-2.5 border-l-4 ${BORDER_COLORS[status] ?? "border-l-gray-400"} rounded-tl-lg border-b border-border-card`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-body-bold text-heading">{label}</span>
          <span className="text-exs text-muted bg-surface border border-border-card rounded-full px-2 py-0.5 font-body-medium min-w-[22px] text-center">
            {tickets.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 p-2 overflow-y-auto flex-1 min-h-[120px]"
      >
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.length === 0 ? (
            <div className={`flex items-center justify-center flex-1 border-2 border-dashed rounded-lg mx-1 my-2 py-10 ${
              blocked ? "border-red-300/40" : "border-border-card/40"
            }`}>
              <span className="text-sm text-muted">
                {blocked ? t("tickets.boardCannotDrop") : t("tickets.boardDropHere")}
              </span>
            </div>
          ) : (
            tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                tags={tags}
                members={members}
                categoryName={categories.find((c) => c.id === ticket.categoryId)?.name}
                onClick={() => onTicketClick(ticket.id)}
                tEnum={tEnum}
                disabled={isTicketDisabled?.(ticket)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
