import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TicketListItem } from "../services/ticket.service";
import type { Tag } from "@modules/tag/services/tag.service";
import type { WorkspaceMember } from "@modules/workspace/services/workspace.service";
import useTranslation from "@modules/app/i18n/useTranslation";

const PRIORITY_BORDER: Record<string, string> = {
  low: "border-l-gray-300",
  medium: "border-l-yellow-400",
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
  const { t } = useTranslation();
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

  const ticketId = ticket.ticketNumber ? `#${ticket.ticketNumber}` : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-ticket-id={ticket.id}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group bg-surface border border-border-card border-l-[3px] ${PRIORITY_BORDER[ticket.priority] ?? "border-l-gray-300"} rounded-lg px-2.5 py-2 cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-px transition-all ${
        isDragging ? "opacity-40 rotate-1 scale-[1.02] shadow-lg" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {(ticket.firstResponseBreached || ticket.resolutionBreached) && ticket.status !== "resolved" && ticket.status !== "discarded" && (
            <span
              className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse"
              title={t("ticketDetail.slaBreached")}
            />
          )}
          <p className="text-[13px] font-semibold text-heading line-clamp-2 leading-tight flex-1">
            {ticket.name}
          </p>
        </div>
        {initials && (
          <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary text-[9px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
            {initials}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {ticketId && <span className="text-[10px] text-muted font-mono">{ticketId}</span>}
        <span className="text-[10px] text-muted">{tEnum("category", ticket.category)}</span>
        {ticketTags.slice(0, 2).map((tag) => (
          <span
            key={tag.id}
            className="text-[10px] px-1 py-px rounded text-white/90"
            style={{ backgroundColor: tag.color || "#6366f1" }}
          >
            {tag.name}
          </span>
        ))}
        {ticketTags.length > 2 && (
          <span className="text-[10px] text-muted">+{ticketTags.length - 2}</span>
        )}
        <span className="text-[10px] text-muted/60 ml-auto">{timeAgo}</span>
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
