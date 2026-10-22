import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TicketFilters } from "../services/ticket.service";
import { LOCAL_STORAGE_KEY } from "@modules/app/domain/core/local-storage";
import { readPageSize, savePageSize } from "@modules/app/domain/core/pagination";
import {
  EMPTY_SELECTION, KnownIds, TicketListSelection, pruneSelection, readSelection, saveSelection,
  selectionFilterCount, statusesParam, toggleAllStatuses, toggleStatus, toggleValue,
} from "../domain/ticket-list-selection";

/** The filters of the popover that hold a list of ids or values (all but the statuses). */
export type SelectionListField = "priorities" | "departmentIds" | "organizationIds" | "categoryIds" | "tagIds";

export interface UseTicketFiltersReturn {
  /** Search, sort, page and page size. */
  filters: TicketFilters;
  setFilters: React.Dispatch<React.SetStateAction<TicketFilters>>;
  /** The popover's filters, remembered per workspace in this browser. */
  selection: TicketListSelection;
  toggleStatus: (status: string) => void;
  toggleAllStatuses: () => void;
  toggleIn: (field: SelectionListField, value: string) => void;
  clearField: (field: SelectionListField | "statuses" | "reopened") => void;
  toggleReopened: () => void;
  /** Drops the remembered ids that no longer exist, once the workspace's lists have loaded. */
  pruneUnknown: (known: KnownIds) => void;
  /** The selection as list filters for the API; `withStatuses` is false on the board. */
  selectionParams: (withStatuses: boolean) => Partial<TicketFilters>;
  filterProjectId: string | undefined;
  setFilterProjectId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setPage: (page: number) => void;
  /** Changes the page size, remembers it in this browser and goes back to the first page. */
  setLimit: (limit: number) => void;
  viewMode: "left" | "right";
  setViewMode: React.Dispatch<React.SetStateAction<"left" | "right">>;
  isBoard: boolean;
  toggleSort: (field: string) => void;
  activeFilterCount: number;
  /** Back to the default selection: the role's statuses and nothing else. */
  clearAllFilters: () => void;
}

/**
 * The ticket list's filters, sort and page. Any change of project or filter goes back to the
 * first page, in the same update, so a narrower filter never lands on a page past its end.
 */
export default function useTicketFilters(workspaceSlug: string | undefined, isReporter: boolean, initialPage = 1): UseTicketFiltersReturn {
  const [viewMode, setViewMode] = useState<"left" | "right">("left");
  const [filters, setFilters] = useState<TicketFilters>(() => ({
    page: initialPage,
    limit: readPageSize(LOCAL_STORAGE_KEY.PAGE_SIZE_TICKETS),
    sortBy: "createdAt",
    sortOrder: "DESC",
  }));
  const [filterProjectId, setProjectIdRaw] = useState<string | undefined>(undefined);
  const [selection, setSelectionRaw] = useState<TicketListSelection>(() => readSelection(workspaceSlug));

  // Mirrors, so a change is saved for the workspace it was made in, outside the state updater
  const selectionRef = useRef(selection);
  const slugRef = useRef(workspaceSlug);
  useEffect(() => {
    if (slugRef.current === workspaceSlug) return;
    slugRef.current = workspaceSlug;
    const loaded = readSelection(workspaceSlug);
    selectionRef.current = loaded;
    setSelectionRaw(loaded);
  }, [workspaceSlug]);

  const resetPage = useCallback(() => setFilters((f) => (f.page === 1 ? f : { ...f, page: 1 })), []);
  const update = useCallback((change: (s: TicketListSelection) => TicketListSelection, keepPage = false) => {
    const next = change(selectionRef.current);
    if (next === selectionRef.current) return;
    selectionRef.current = next;
    setSelectionRaw(next);
    saveSelection(slugRef.current, next);
    if (!keepPage) resetPage();
  }, [resetPage]);

  const setFilterProjectId = useMemo(() => (value: SetStateAction<string | undefined>) => { setProjectIdRaw(value); resetPage(); }, [resetPage]) as Dispatch<SetStateAction<string | undefined>>;

  const setPage = useCallback((page: number) => setFilters((f) => (f.page === page ? f : { ...f, page })), []);
  const setLimit = useCallback((limit: number) => {
    savePageSize(LOCAL_STORAGE_KEY.PAGE_SIZE_TICKETS, limit);
    setFilters((f) => ({ ...f, limit, page: 1 }));
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

  const selectionParams = useCallback((withStatuses: boolean): Partial<TicketFilters> => {
    const list = (values: string[]) => (values.length ? values : undefined);
    return {
      statuses: withStatuses ? statusesParam(selection, isReporter) : undefined,
      priorities: list(selection.priorities),
      departmentIds: list(selection.departmentIds),
      organizationIds: list(selection.organizationIds),
      categoryIds: list(selection.categoryIds),
      tagIds: list(selection.tagIds),
      reopened: selection.reopened || undefined,
    };
  }, [selection, isReporter]);

  return {
    filters,
    setFilters,
    selection,
    toggleStatus: (status) => update((s) => ({ ...s, statuses: toggleStatus(s, status, isReporter) })),
    toggleAllStatuses: () => update((s) => ({ ...s, statuses: toggleAllStatuses(s, isReporter) })),
    toggleIn: (field, value) => update((s) => ({ ...s, [field]: toggleValue(s[field], value) })),
    clearField: (field) => update((s) => ({ ...s, [field]: field === "statuses" ? null : field === "reopened" ? false : [] })),
    toggleReopened: () => update((s) => ({ ...s, reopened: !s.reopened })),
    pruneUnknown: useCallback((known: KnownIds) => update((s) => pruneSelection(s, known), true), [update]),
    selectionParams,
    filterProjectId,
    setFilterProjectId,
    setPage,
    setLimit,
    viewMode,
    setViewMode,
    isBoard: viewMode === "right",
    toggleSort,
    activeFilterCount: selectionFilterCount(selection, isReporter),
    clearAllFilters: () => update(() => EMPTY_SELECTION),
  };
}
