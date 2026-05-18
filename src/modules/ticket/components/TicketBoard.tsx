import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import useTranslation from "@modules/app/i18n/useTranslation";
import { useBoardTickets, type BoardColumns } from "../hooks/useBoardTickets";
import TicketColumn from "./TicketColumn";
import TicketCard from "./TicketCard";
import type { TicketListItem, TicketFilters } from "../services/ticket.service";

const BOARD_STATUSES = ["pending", "in-progress", "resolved"] as const;

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
  workspaceSlug: string;
  filters: Omit<TicketFilters, "page" | "limit" | "excludeStatus">;
  tags: Tag[];
  members: Member[];
  onTicketClick: (ticketId: string) => void;
  canChangeStatus: boolean;
}

export default function TicketBoard({ workspaceSlug, filters, tags, members, onTicketClick, canChangeStatus }: Props) {
  const { tEnum } = useTranslation();
  const { columns, loading, moveTicket } = useBoardTickets(workspaceSlug, filters);
  const [activeTicket, setActiveTicket] = useState<TicketListItem | null>(null);
  const [activeWidth, setActiveWidth] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const findColumnForTicket = useCallback((ticketId: string): string | null => {
    for (const status of BOARD_STATUSES) {
      if (columns[status].some((t) => t.id === ticketId)) return status;
    }
    return null;
  }, [columns]);

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    const status = findColumnForTicket(id);
    if (status) {
      setActiveTicket(columns[status as keyof BoardColumns].find((t) => t.id === id) ?? null);
      const el = document.querySelector(`[data-ticket-id="${id}"]`);
      if (el) setActiveWidth(el.getBoundingClientRect().width);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    if (!canChangeStatus) return;

    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id as string;
    let toStatus = over.id as string;

    if (!BOARD_STATUSES.includes(toStatus as any)) {
      const col = findColumnForTicket(toStatus);
      if (col) toStatus = col;
      else return;
    }

    moveTicket(ticketId, toStatus);
  };

  const handleDragCancel = () => setActiveTicket(null);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner width={24} />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 280px)" }}>
        {BOARD_STATUSES.map((status) => (
          <TicketColumn
            key={status}
            status={status}
            label={tEnum("status", status)}
            tickets={columns[status]}
            tags={tags}
            members={members}
            onTicketClick={onTicketClick}
            tEnum={tEnum}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTicket && (
          <div style={{ width: activeWidth || undefined }}>
            <TicketCard
              ticket={activeTicket}
              tags={tags}
              members={members}
              onClick={() => {}}
              tEnum={tEnum}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
