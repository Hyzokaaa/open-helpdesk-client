import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import { PRIORITY_COLORS, CATEGORY_COLORS } from "../domain/ticket-enums";
import type { TicketListItem } from "../services/ticket.service";
import type { Tag } from "@modules/tag/services/tag.service";
import type { WorkspaceMember } from "@modules/workspace/services/workspace.service";

const PRIORITY_BORDER: Record<string, string> = {
  low: "border-l-gray-400",
  medium: "border-l-yellow-500",
  high: "border-l-orange-500",
  critical: "border-l-red-500",
};

interface Props {
  ticket: TicketListItem;
  tags: Tag[];
  members: WorkspaceMember[];
  onClick: () => void;
  tEnum: (ns: string, key: string) => string;
}

export default function TicketCard({ ticket, tags, members, onClick, tEnum }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const assignee = members.find((m) => m.userId === ticket.assigneeId);
  const initials = assignee
    ? `${(assignee.firstName ?? "")[0] ?? ""}${(assignee.lastName ?? "")[0] ?? ""}`.toUpperCase()
    : null;

  const ticketTags = ticket.tagIds
    .map((id) => tags.find((t) => t.id === id))
    .filter(Boolean) as Tag[];

  const timeAgo = ticket.createdAt
    ? formatTimeAgo(new Date(ticket.createdAt))
    : "";

  const shortId = `#${ticket.id.slice(-6)}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-ticket-id={ticket.id}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group bg-surface border border-border-card border-l-[3px] ${PRIORITY_BORDER[ticket.priority] ?? "border-l-gray-400"} rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
        isDragging ? "opacity-40 rotate-2 scale-105 shadow-lg" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-exs text-muted font-mono">{shortId}</span>
        <span className="text-exs text-muted">{timeAgo}</span>
      </div>

      <p className="text-sm font-body-semibold text-heading line-clamp-2 mb-1.5">
        {ticket.name}
      </p>

      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
        <StatusBadge
          label={tEnum("priority", ticket.priority)}
          color={PRIORITY_COLORS[ticket.priority] ?? "gray"}
          size="xs"
        />
        <StatusBadge
          label={tEnum("category", ticket.category)}
          color={CATEGORY_COLORS[ticket.category] ?? "gray"}
          size="xs"
        />
      </div>

      {ticketTags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mb-1.5">
          {ticketTags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="text-exs px-1.5 py-0.5 rounded-full text-white/90"
              style={{ backgroundColor: tag.color || "#6366f1" }}
            >
              {tag.name}
            </span>
          ))}
          {ticketTags.length > 3 && (
            <span className="text-exs text-subtle">+{ticketTags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-end">
        {initials ? (
          <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary text-[9px] font-body-semibold flex items-center justify-center">
            {initials}
          </span>
        ) : (
          <span className="w-5 h-5 rounded-full border border-dashed border-subtle text-muted text-[9px] flex items-center justify-center">
            +
          </span>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
