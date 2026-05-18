import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { STATUS_COLORS } from "../domain/ticket-enums";
import TicketCard from "./TicketCard";
import type { TicketListItem } from "../services/ticket.service";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Member {
  userId: string;
  firstName?: string;
  lastName?: string;
}

interface Props {
  status: string;
  label: string;
  tickets: TicketListItem[];
  tags: Tag[];
  members: Member[];
  onTicketClick: (ticketId: string) => void;
  tEnum: (ns: string, key: string) => string;
}

const BORDER_COLORS: Record<string, string> = {
  pending: "border-l-gray-400",
  "in-progress": "border-l-blue-500",
  resolved: "border-l-green-500",
};

export default function TicketColumn({ status, label, tickets, tags, members, onTicketClick, tEnum }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      className={`flex flex-col min-w-[280px] flex-1 rounded-lg border border-border-card bg-surface-hover ${
        isOver ? "ring-2 ring-primary-400" : ""
      }`}
    >
      <div className={`flex items-center justify-between px-3 py-2.5 border-l-4 ${BORDER_COLORS[status] ?? "border-l-gray-400"} rounded-tl-lg`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-body-bold text-heading">{label}</span>
          <span className="text-exs text-subtle bg-surface rounded-full px-1.5 py-0.5 font-body-medium">
            {tickets.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 p-2 overflow-y-auto flex-1 min-h-[120px]"
      >
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              tags={tags}
              members={members}
              onClick={() => onTicketClick(ticket.id)}
              tEnum={tEnum}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
