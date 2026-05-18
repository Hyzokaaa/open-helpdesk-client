import { useState, useCallback, useRef } from "react";
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
  type DragOverEvent,
} from "@dnd-kit/core";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import useTranslation from "@modules/app/i18n/useTranslation";
import { useBoardTickets, type BoardColumns } from "../hooks/useBoardTickets";
import TicketColumn from "./TicketColumn";
import TicketCard from "./TicketCard";
import type { TicketListItem, TicketFilters } from "../services/ticket.service";
import type { Tag } from "@modules/tag/services/tag.service";
import type { WorkspaceMember } from "@modules/workspace/services/workspace.service";

const BOARD_STATUSES = ["pending", "in-progress", "resolved"] as const;
type BoardStatus = (typeof BOARD_STATUSES)[number];

interface Props {
  workspaceSlug: string;
  filters: Omit<TicketFilters, "page" | "limit" | "excludeStatus">;
  tags: Tag[];
  members: WorkspaceMember[];
  onTicketClick: (ticketId: string) => void;
  canChangeStatus: boolean;
}

export default function TicketBoard({ workspaceSlug, filters, tags, members, onTicketClick, canChangeStatus }: Props) {
  const { tEnum } = useTranslation();
  const { columns, loading, commitMove, reorderColumn, setColumns, setDragging } = useBoardTickets(workspaceSlug, filters);
  const [activeTicket, setActiveTicket] = useState<TicketListItem | null>(null);
  const [activeWidth, setActiveWidth] = useState(0);
  const dragStartColumns = useRef<BoardColumns | null>(null);
  const dragStartStatus = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const findColumn = useCallback((id: string): string | null => {
    if (BOARD_STATUSES.includes(id as any)) return id;
    for (const status of BOARD_STATUSES) {
      if (columnsRef.current[status].some((t) => t.id === id)) return status;
    }
    return null;
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    const status = findColumn(id);
    if (status && !BOARD_STATUSES.includes(id as any)) {
      setActiveTicket(columns[status as BoardStatus].find((t) => t.id === id) ?? null);
      dragStartColumns.current = structuredClone(columns);
      dragStartStatus.current = status;
      setDragging(true);
      const el = document.querySelector(`[data-ticket-id="${id}"]`);
      if (el) setActiveWidth(el.getBoundingClientRect().width);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const fromCol = findColumn(activeId);
    const toCol = findColumn(overId);
    if (!fromCol || !toCol || fromCol === toCol) return;

    setColumns((prev) => {
      const ticket = prev[fromCol as BoardStatus].find((t) => t.id === activeId);
      if (!ticket) return prev;

      const fromItems = prev[fromCol as BoardStatus].filter((t) => t.id !== activeId);
      const toItems = prev[toCol as BoardStatus].filter((t) => t.id !== activeId);

      const overIndex = toItems.findIndex((t) => t.id === overId);
      if (overIndex >= 0) {
        toItems.splice(overIndex, 0, { ...ticket, status: toCol });
      } else {
        toItems.push({ ...ticket, status: toCol });
      }

      return { ...prev, [fromCol]: fromItems, [toCol]: toItems };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);
    setDragging(false);

    if (!over || !dragStartColumns.current || !dragStartStatus.current) {
      dragStartColumns.current = null;
      dragStartStatus.current = null;
      return;
    }

    const ticketId = active.id as string;
    const originalStatus = dragStartStatus.current;
    const currentCol = findColumn(ticketId);

    dragStartColumns.current = null;
    dragStartStatus.current = null;

    if (!currentCol) return;

    // Intra-column reorder (same column, or already moved to new column by onDragOver)
    const items = columnsRef.current[currentCol as BoardStatus];
    const fromIndex = items.findIndex((t) => t.id === ticketId);
    const overId = over.id as string;
    const toIndex = items.findIndex((t) => t.id === overId);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      reorderColumn(currentCol as BoardStatus, fromIndex, toIndex);
    }

    // Cross-column: commit status change to backend
    if (currentCol !== originalStatus) {
      if (!canChangeStatus) {
        setColumns(structuredClone(columnsRef.current));
        return;
      }
      const updatedColumns = columnsRef.current;
      const targetIndex = updatedColumns[currentCol as BoardStatus].findIndex((t) => t.id === ticketId);
      commitMove(ticketId, originalStatus, currentCol, updatedColumns, targetIndex >= 0 ? targetIndex : undefined);
    }
  };

  const handleDragCancel = () => {
    setActiveTicket(null);
    setDragging(false);
    if (dragStartColumns.current) {
      setColumns(dragStartColumns.current);
      dragStartColumns.current = null;
      dragStartStatus.current = null;
    }
  };

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
      onDragOver={handleDragOver}
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
