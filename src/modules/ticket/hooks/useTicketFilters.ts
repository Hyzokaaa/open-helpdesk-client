import { useEffect, useRef, useState } from "react";
import { TicketFilters } from "../services/ticket.service";

export type Tab = "active" | "resolved" | "discarded";

export interface UseTicketFiltersReturn {
  filters: TicketFilters;
  setFilters: React.Dispatch<React.SetStateAction<TicketFilters>>;
  filterTagIds: string[];
  setFilterTagIds: React.Dispatch<React.SetStateAction<string[]>>;
  filterProjectId: string | undefined;
  setFilterProjectId: React.Dispatch<React.SetStateAction<string | undefined>>;
  filterDepartmentId: string | undefined;
  setFilterDepartmentId: React.Dispatch<React.SetStateAction<string | undefined>>;
  filterOrganizationId: string | undefined;
  setFilterOrganizationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  filterCategoryId: string | undefined;
  setFilterCategoryId: React.Dispatch<React.SetStateAction<string | undefined>>;
  tab: Tab;
  setTab: React.Dispatch<React.SetStateAction<Tab>>;
  viewMode: "left" | "right";
  setViewMode: React.Dispatch<React.SetStateAction<"left" | "right">>;
  isBoard: boolean;
  toggleSort: (field: string) => void;
  activeFilterCount: number;
  clearAllFilters: () => void;
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
  const [filterProjectId, setFilterProjectId] = useState<string | undefined>(undefined);
  const [filterDepartmentId, setFilterDepartmentId] = useState<string | undefined>(undefined);
  const [filterOrganizationId, setFilterOrganizationId] = useState<string | undefined>(undefined);
  const [filterCategoryId, setFilterCategoryId] = useState<string | undefined>(undefined);

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

  const activeFilterCount =
    (filters.priority ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filterDepartmentId ? 1 : 0) +
    (filterOrganizationId ? 1 : 0) +
    (filterCategoryId ? 1 : 0) +
    filterTagIds.length;

  const clearAllFilters = () => {
    setFilters((prev) => ({ ...prev, priority: undefined, status: undefined, page: 1 }));
    setFilterTagIds([]);
    setFilterDepartmentId(undefined);
    setFilterOrganizationId(undefined);
    setFilterCategoryId(undefined);
  };

  return {
    filters,
    setFilters,
    filterTagIds,
    setFilterTagIds,
    filterProjectId,
    setFilterProjectId,
    filterDepartmentId,
    setFilterDepartmentId,
    filterOrganizationId,
    setFilterOrganizationId,
    filterCategoryId,
    setFilterCategoryId,
    tab,
    setTab,
    viewMode,
    setViewMode,
    isBoard: viewMode === "right",
    toggleSort,
    activeFilterCount,
    clearAllFilters,
  };
}
