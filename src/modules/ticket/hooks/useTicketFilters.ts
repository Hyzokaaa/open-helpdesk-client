import { useEffect, useRef, useState } from "react";
import { TicketFilters } from "../services/ticket.service";

export type Tab = "active" | "resolved" | "discarded";

export interface UseTicketFiltersReturn {
  filters: TicketFilters;
  setFilters: React.Dispatch<React.SetStateAction<TicketFilters>>;
  filterTagIds: string[];
  setFilterTagIds: React.Dispatch<React.SetStateAction<string[]>>;
  tab: Tab;
  setTab: React.Dispatch<React.SetStateAction<Tab>>;
  viewMode: "left" | "right";
  setViewMode: React.Dispatch<React.SetStateAction<"left" | "right">>;
  isBoard: boolean;
  tagDropdownOpen: boolean;
  setTagDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tagDropdownRef: React.RefObject<HTMLDivElement | null>;
  toggleSort: (field: string) => void;
}

export default function useTicketFilters(): UseTicketFiltersReturn {
  const [viewMode, setViewMode] = useState<"left" | "right">("left");
  const [tab, setTab] = useState<Tab>("active");
  const [filters, setFilters] = useState<TicketFilters>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleSort = (field: string) => {
    if (filters.sortBy === field) {
      setFilters({
        ...filters,
        sortOrder: filters.sortOrder === "ASC" ? "DESC" : "ASC",
        page: 1,
      });
    } else {
      setFilters({ ...filters, sortBy: field, sortOrder: "ASC", page: 1 });
    }
  };

  return {
    filters,
    setFilters,
    filterTagIds,
    setFilterTagIds,
    tab,
    setTab,
    viewMode,
    setViewMode,
    isBoard: viewMode === "right",
    tagDropdownOpen,
    setTagDropdownOpen,
    tagDropdownRef,
    toggleSort,
  };
}
