import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  listAllTickets,
  changeTicketStatus,
  type TicketListItem,
  type TicketFilters,
} from "../services/ticket.service";

const BOARD_STATUSES = ["pending", "in-progress", "resolved"] as const;
type BoardStatus = (typeof BOARD_STATUSES)[number];
export type BoardColumns = Record<BoardStatus, TicketListItem[]>;

function groupByStatus(tickets: TicketListItem[]): BoardColumns {
  const columns: BoardColumns = { pending: [], "in-progress": [], resolved: [] };
  for (const t of tickets) {
    if (t.status in columns) columns[t.status as BoardStatus].push(t);
  }
  return columns;
}

export function useBoardTickets(
  workspaceSlug: string | undefined,
  filters: Omit<TicketFilters, "page" | "limit" | "excludeStatus">,
) {
  const [columns, setColumns] = useState<BoardColumns>({ pending: [], "in-progress": [], resolved: [] });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!workspaceSlug) return;
    setLoading(true);
    try {
      const items = await listAllTickets(workspaceSlug, {
        ...filters,
        excludeStatus: "discarded",
      });
      setColumns(groupByStatus(items));
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, filters.priority, filters.tagIds?.join(","), filters.creatorId]);

  useEffect(() => { fetch(); }, [fetch]);

  const moveTicket = useCallback(async (ticketId: string, toStatus: string) => {
    if (!workspaceSlug) return;

    const snapshot = structuredClone(columns);
    const fromStatus = BOARD_STATUSES.find((s) => columns[s].some((t) => t.id === ticketId));
    if (!fromStatus || fromStatus === toStatus) return;

    const ticket = columns[fromStatus].find((t) => t.id === ticketId)!;
    setColumns({
      ...columns,
      [fromStatus]: columns[fromStatus].filter((t) => t.id !== ticketId),
      [toStatus]: [...columns[toStatus as BoardStatus], { ...ticket, status: toStatus }],
    });

    try {
      await changeTicketStatus(workspaceSlug, ticketId, toStatus);
    } catch {
      setColumns(snapshot);
      toast.error("Failed to update status");
    }
  }, [workspaceSlug, columns]);

  return { columns, loading, moveTicket, refetch: fetch };
}
