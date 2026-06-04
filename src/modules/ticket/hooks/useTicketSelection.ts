import { useState } from "react";

export interface UseTicketSelectionReturn {
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: (ticketIds: string[]) => void;
  clearSelection: () => void;
}

export default function useTicketSelection(): UseTicketSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ticketIds: string[]) => {
    if (selectedIds.size === ticketIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ticketIds));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  return {
    selectedIds,
    setSelectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
  };
}
