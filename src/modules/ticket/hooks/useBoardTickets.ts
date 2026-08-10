import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  listAllTickets,
  changeTicketStatus,
  pickupTicket,
  getTicket,
  type TicketListItem,
  type TicketFilters,
} from "../services/ticket.service";

const BOARD_STATUSES = ["open", "pending", "in-progress", "resolved"] as const;
type BoardStatus = (typeof BOARD_STATUSES)[number];
export type BoardColumns = Record<BoardStatus, TicketListItem[]>;

const POLL_INTERVAL = 30_000;

function storageKey(workspaceSlug: string): string {
  return `board-order:${workspaceSlug}`;
}

function loadOrder(workspaceSlug: string): Record<string, string[]> | null {
  try {
    const raw = localStorage.getItem(storageKey(workspaceSlug));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveOrder(workspaceSlug: string, columns: BoardColumns): void {
  const order: Record<string, string[]> = {};
  for (const status of BOARD_STATUSES) {
    order[status] = columns[status].map((t) => t.id);
  }
  localStorage.setItem(storageKey(workspaceSlug), JSON.stringify(order));
}

function applyOrder(tickets: TicketListItem[], savedIds: string[] | undefined): TicketListItem[] {
  if (!savedIds || savedIds.length === 0) {
    return tickets.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }

  const known: TicketListItem[] = [];
  const newTickets: TicketListItem[] = [];

  for (const t of tickets) {
    if (savedIds.includes(t.id)) {
      known.push(t);
    } else {
      newTickets.push(t);
    }
  }

  known.sort((a, b) => savedIds.indexOf(a.id) - savedIds.indexOf(b.id));
  newTickets.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return [...newTickets, ...known];
}

function groupByStatus(tickets: TicketListItem[], workspaceSlug: string): BoardColumns {
  const columns: BoardColumns = { open: [], pending: [], "in-progress": [], resolved: [] };
  for (const t of tickets) {
    if (t.status in columns) columns[t.status as BoardStatus].push(t);
  }

  const saved = loadOrder(workspaceSlug);
  for (const status of BOARD_STATUSES) {
    columns[status] = applyOrder(columns[status], saved?.[status]);
  }

  return columns;
}

export function useBoardTickets(
  workspaceSlug: string | undefined,
  filters: Omit<TicketFilters, "page" | "limit" | "excludeStatus">,
) {
  const [columns, setColumns] = useState<BoardColumns>({ open: [], pending: [], "in-progress": [], resolved: [] });
  const [loading, setLoading] = useState(true);
  const [truncatedInfo, setTruncatedInfo] = useState<{ truncated: boolean; total: number }>({ truncated: false, total: 0 });
  const isDragging = useRef(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!workspaceSlug) return;
    if (isDragging.current) return;
    if (!silent) setLoading(true);
    try {
      const { items, total, truncated } = await listAllTickets(workspaceSlug, {
        ...filters,
        excludeStatus: "discarded",
      });
      setColumns(groupByStatus(items, workspaceSlug));
      setTruncatedInfo({ truncated, total });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [workspaceSlug, filters.search, filters.priority, filters.tagIds?.join(","), filters.departmentId, filters.reporterId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => fetchData(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const reorderColumn = useCallback((status: BoardStatus, fromIndex: number, toIndex: number) => {
    if (!workspaceSlug) return;
    setColumns((prev) => {
      const items = [...prev[status]];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      const updated = { ...prev, [status]: items };
      saveOrder(workspaceSlug, updated);
      return updated;
    });
  }, [workspaceSlug]);

  const commitMove = useCallback(async (
    ticketId: string,
    originalStatus: string,
    newStatus: string,
    currentColumns: BoardColumns,
    targetIndex?: number,
  ) => {
    if (!workspaceSlug) return;

    isDragging.current = true;
    const snapshot = structuredClone(currentColumns);
    saveOrder(workspaceSlug, currentColumns);

    try {
      if (originalStatus === 'open' && newStatus !== 'open') {
        await pickupTicket(workspaceSlug, ticketId);
      } else {
        await changeTicketStatus(workspaceSlug, ticketId, newStatus);
      }
      isDragging.current = false;
      // Refetch only the moved ticket to get updated fields (assignee, etc.)
      getTicket(workspaceSlug, ticketId).then((detail) => {
        setColumns((prev) => {
          const updated = { ...prev };
          const col = updated[newStatus as BoardStatus];
          if (col) {
            updated[newStatus as BoardStatus] = col.map((t) =>
              t.id === ticketId ? { ...t, status: detail.status, assigneeId: detail.assigneeId } : t,
            );
          }
          return updated;
        });
      }).catch(() => {});
    } catch {
      setColumns(snapshot);
      saveOrder(workspaceSlug, snapshot);
      toast.error("Failed to update status");
      isDragging.current = false;
    }
  }, [workspaceSlug]);

  const setDragging = useCallback((value: boolean) => {
    isDragging.current = value;
  }, []);

  return { columns, loading, truncatedInfo, commitMove, reorderColumn, setColumns, setDragging, refetch: () => fetchData() };
}
