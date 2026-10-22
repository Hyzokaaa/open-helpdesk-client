import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import clsx from "clsx";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import useColumnDrag from "@modules/shared/hooks/useColumnDrag";
import SortableTh from "@modules/app/modules/ui/components/SortableTh/SortableTh";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import useUser from "@modules/user/hooks/useUser";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { useMembershipChanged } from "@modules/workspace/domain/membership-events";
import { P } from "@modules/workspace/domain/permissions";
import {
  TicketListItem,
  TicketFilters,
  listTickets,
  deleteTicket,
  changeTicketStatus,
  assignTicket,
  transferTicket,
  pickupTicket,
  getTicket,
  reopenTicket,
  type TicketDetail,
} from "../services/ticket.service";
import ReopenTicketModal from "../components/ReopenTicketModal";
import { canReopenTicket, statusesFrom } from "../domain/ticket-reopen";
import {
  PRIORITY_COLORS,
  STATUS_COLORS,
  STATUSES,
  PICKUP_STATUSES,
  PRIORITIES,
} from "../domain/ticket-enums";
import { FILTER_MINE, FILTER_NONE, isDefaultStatuses, statusesParam } from "../domain/ticket-list-selection";
import { canDiscardFromQueue, canMoveTicketStatus } from "../domain/can-move-ticket-status";
import { listCategories, listProjects, type TicketCategoryDto, type Project } from "@modules/project/services/project.service";
import { PaginatedResult } from "@modules/shared/domain/pagination-result";
import { Tag, listTags } from "@modules/tag/services/tag.service";
import { Department, listDepartments } from "@modules/department/services/department.service";
import { Organization, listOrganizations } from "@modules/organization/services/organization.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import Toggle from "@modules/app/modules/ui/components/Toggle/Toggle";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import TicketMemberPickerModal from "../components/TicketMemberPickerModal";
import { listMembers, type WorkspaceMember } from "@modules/workspace/services/workspace.service";
import TicketBoard from "../components/TicketBoard";
import TicketStatusModal from "../components/TicketStatusModal";
import TicketDiscardReasonModal from "../components/TicketDiscardReasonModal";
import useWebSocket from "@modules/shared/hooks/useWebSocket";
import useTicketFilters from "../hooks/useTicketFilters";
import useTicketSelection from "../hooks/useTicketSelection";
import useBulkOperations from "../hooks/useBulkOperations";
import TicketFilterBar from "../components/TicketFilterBar";
import TicketBulkActions from "../components/TicketBulkActions";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import { canBeAssignee } from "../domain/can-be-assignee";
import PageLoader from "@modules/shared/components/PageLoader/PageLoader";
import Pagination from "@modules/app/modules/ui/components/Pagination/Pagination";
import { scrollToTopOf } from "@modules/app/domain/core/scroll-root";
import EmptyState from "@modules/app/modules/ui/components/EmptyState/EmptyState";
import { ticketListEmpty } from "../domain/ticket-list-empty";
import { clampPage, parsePageParam } from "@modules/app/domain/core/pagination";

// Loaded when a ticket is opened or created: they bring the rich text editor, which the list does not need
const TicketDetailPage = lazy(() => import("./TicketDetailPage"));
const TicketCreatePage = lazy(() => import("./TicketCreatePage"));

interface Column {
  key: string;
  labelKey: string;
  sortable: boolean;
}

/** Tags a row shows before folding the rest into "+N" */const VISIBLE_ROW_TAGS = 2;
const BASE_COLUMNS: Column[] = [
  { key: "ticketNumber", labelKey: "tickets.col.number", sortable: true },
  { key: "name", labelKey: "tickets.col.name", sortable: true },
  { key: "category", labelKey: "tickets.col.category", sortable: true },
  { key: "priority", labelKey: "tickets.col.priority", sortable: true },
  { key: "status", labelKey: "tickets.col.status", sortable: true },
  { key: "tags", labelKey: "tickets.col.tags", sortable: false },
  { key: "createdAt", labelKey: "tickets.col.created", sortable: true },
];

export default function TicketsPage() {
  const { workspaceSlug } = useParams();
  const { t, tEnum } = useTranslation();
  const { user } = useUser();
  const { can, loading: permLoading } = usePermissions(workspaceSlug);
  const isReporter = !permLoading && !can(P.TICKET_VIEW) && !can(P.TICKET_CHANGE_STATUS);
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    filters, setFilters, selection, toggleStatus, toggleAllStatuses, toggleIn, clearField, toggleReopened, pruneUnknown, selectionParams,
    filterProjectId, setFilterProjectId,
    setPage, setLimit, viewMode, setViewMode, isBoard,
    toggleSort, activeFilterCount, clearAllFilters,
  } = useTicketFilters(workspaceSlug, isReporter, parsePageParam(searchParams.get("page")));
  const tableTopRef = useRef<HTMLDivElement>(null);

  const {
    selectedIds, setSelectedIds, toggleSelect, toggleSelectAll, clearSelection,
  } = useTicketSelection();

  const [boardKey, setBoardKey] = useState(0);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [result, setResult] = useState<PaginatedResult<TicketListItem> | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [categories, setCategories] = useState<TicketCategoryDto[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const COLUMNS = useMemo(() => {
    const cols = [...BASE_COLUMNS];
    if (departments.length > 0) {
      cols.splice(2, 0, { key: "department", labelKey: "ticketDetail.department", sortable: true });
    }
    if (orgs.length > 0) {
      cols.splice(2, 0, { key: "organization", labelKey: "ticketDetail.organization", sortable: true });
    }
    return cols;
  }, [orgs.length, departments.length]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketMode, setTicketMode] = useState<"view" | "edit">("view");
  const [ticketDirty, setTicketDirty] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createDirty, setCreateDirty] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [assignTicketId, setAssignTicketId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [assignMode, setAssignMode] = useState<"assign" | "transfer">("assign");
  const [pickupTarget, setPickupTarget] = useState<TicketListItem | null>(null);
  const [pickupStatus, setPickupStatus] = useState<string>(PICKUP_STATUSES[0]);
  // Discarding straight from the queue has its own state, apart from the change-status flow, so
  // backing out of it closes it instead of falling back to the status picker.
  const [discardTarget, setDiscardTarget] = useState<TicketListItem | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<TicketListItem | null>(null);
  // Reopening asks for a reason in its own modal, with the full ticket (who resolved it, when)
  const [reopenTarget, setReopenTarget] = useState<TicketDetail | null>(null);
  // The board column the card was dropped on, so the modal starts from what was meant
  const [reopenDroppedOn, setReopenDroppedOn] = useState<string | undefined>(undefined);
  const openReopen = async (ticketId: string, droppedOn?: string) => {
    if (!workspaceSlug) return;
    try {
      const detail = await getTicket(workspaceSlug, ticketId);
      setReopenDroppedOn(droppedOn);
      setReopenTarget(detail);
    } catch { toast.error(t("reopen.error")); }
  };

  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) {
      setSelectedTicketId(openId);
      setTicketMode("view");
      // Only "open" goes: the page stays in the address
      setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete("open"); return next; }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // The page is in the address (?page=), replaced rather than pushed so Back leaves the list
  useEffect(() => {
    const want = filters.page && filters.page > 1 ? String(filters.page) : null;
    if (searchParams.get("page") === want) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (want) next.set("page", want); else next.delete("page");
      return next;
    }, { replace: true });
  }, [filters.page]);

  const changePage = (page: number) => {
    setPage(page);
    scrollToTopOf(tableTopRef.current);
  };

  const fetchTickets = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    const params: TicketFilters = { ...filters, ...selectionParams(true) };
    if (filterProjectId) params.projectId = filterProjectId;
    if (isReporter && user) params.reporterId = user.id;
    listTickets(workspaceSlug, params)
      .then((r) => {
        // Past the end (a bulk delete on the last page, an old address): to the last page there is
        const page = params.page ?? 1;
        if (r.items.length === 0 && r.total > 0 && page > 1) setPage(clampPage(page, r.total, r.limit));
        else setResult(r);
      })
      .catch(() => toast.error(t("tickets.loadError")))
      .finally(() => setLoading(false));
  };

  const bulk = useBulkOperations({
    workspaceSlug,
    selectedIds,
    clearSelection,
    selectOnly: (ids) => setSelectedIds(new Set(ids)),
    onRefresh: fetchTickets,
    t,
  });

  const handleCreateClose = useCallback(() => {
    if (createDirty) {
      setShowDiscard(true);
    } else {
      setShowCreate(false);
      setCreateDirty(false);
    }
  }, [createDirty]);

  const sensors = useSensors(useSensor(PointerSensor));
  const { order, handleDragEnd, reorder } = useColumnDrag(COLUMNS.map((c) => c.key));

  // Only the lists this member may read: a refused request is recorded as a denied access.
  // Customers get their tickets' names from the tickets themselves.
  useEffect(() => {
    if (!workspaceSlug || permLoading) return;
    // Each list, once loaded, also drops the remembered filters on ids that no longer exist
    const ids = (items: { id: string }[]) => items.map((i) => i.id);
    if (can(P.TAG_VIEW)) listTags(workspaceSlug).then((r) => { setTags(r); pruneUnknown({ tagIds: ids(r) }); }).catch(() => {});
    if (can(P.DEPARTMENT_VIEW)) listDepartments(workspaceSlug).then((r) => { setDepartments(r); pruneUnknown({ departmentIds: ids(r) }); }).catch(() => {});
    if (can(P.ORGANIZATION_VIEW)) listOrganizations(workspaceSlug).then((r) => { setOrgs(r); pruneUnknown({ organizationIds: ids(r) }); }).catch(() => {});
    if (can(P.WORKSPACE_MEMBERS_VIEW)) listMembers(workspaceSlug).then(setMembers).catch(() => {});
    listCategories(workspaceSlug).then((r) => { setCategories(r); pruneUnknown({ categoryIds: ids(r) }); }).catch(() => {});
    if (can(P.PROJECT_VIEW)) listProjects(workspaceSlug).then(setProjects).catch(() => {});
  }, [workspaceSlug, permLoading]);
  // A system admin joining the workspace now shows up as an assignee
  useMembershipChanged(workspaceSlug, () => {
    if (workspaceSlug) listMembers(workspaceSlug).then(setMembers).catch(() => {});
  });

  useEffect(() => {
    if (!permLoading) fetchTickets();
    setSelectedIds(new Set());
  }, [workspaceSlug, filters, selection, filterProjectId, permLoading, isReporter, viewMode]);

  const refetchAll = useCallback(() => {
    fetchTickets();
    setBoardKey((k) => k + 1);
  }, [workspaceSlug, filters, selection, filterProjectId, permLoading, isReporter, viewMode]);

  useWebSocket(workspaceSlug, {
    "ticket.created": refetchAll,
    "ticket.statusChanged": refetchAll,
    "ticket.assigned": refetchAll,
    "comment.created": refetchAll,
  });

  const tickets = result?.items ?? [];
  const emptyKind = ticketListEmpty({ activeFilterCount, search: filters.search, projectId: filterProjectId });
  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const orgMap = new Map(orgs.map((o) => [o.id, o]));
  const deptMap = new Map(departments.map((d) => [d.id, d]));

  const formatDate = useFormatDate();

  return (
    <div className="w-full flex flex-col h-full">
      {/* Tier 1: Project tabs + Toggle + New Ticket */}
      <div className="flex items-center border-b border-border-card mb-3">
        <div className="flex items-center gap-0 overflow-x-auto flex-1 scrollbar-hide">
          <button
            onClick={() => setFilterProjectId(undefined)}
            className={clsx(
              "px-4 py-2.5 text-sm font-body-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer",
              !filterProjectId ? "border-primary-600 text-primary" : "border-transparent text-muted hover:text-heading hover:border-border-card",
            )}
          >
            {t("tickets.allProjects")}
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setFilterProjectId(p.id)}
              className={clsx(
                "px-4 py-2.5 text-sm font-body-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer",
                filterProjectId === p.id ? "border-primary-600 text-primary" : "border-transparent text-muted hover:text-heading hover:border-border-card",
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0 pl-4 pb-1">
          <div className="hidden md:block">
            <Toggle left={t("tickets.listView")} right={t("tickets.boardView")} active={viewMode} onChange={setViewMode} />
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>{t("tickets.new")}</Button>
        </div>
      </div>

      {/* Tier 2: Search + Filters popover */}
      <div className="flex items-center gap-3 mb-3">
        <TicketFilterBar
          filters={filters}
          setFilters={setFilters}
          selection={selection}
          toggleStatus={toggleStatus}
          toggleAllStatuses={toggleAllStatuses}
          toggleIn={toggleIn}
          clearField={clearField}
          toggleReopened={toggleReopened}
          isReporter={isReporter}
          tags={tags}
          departments={departments}
          organizations={orgs}
          categories={categories}
          activeFilterCount={activeFilterCount}
          isBoard={isBoard}
        />
      </div>

      {/* Tier 3: Active filter chips, one per filter */}
      {/* The status chip is always there on the list, so it is clear which tickets are hidden; its ✕ only when it is not the default */}
      {(!isBoard || activeFilterCount > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {!isBoard && (
            <FilterChip
              label={`${t("tickets.col.status")}: ${statusesParam(selection, isReporter)?.map((s) => tEnum("status", s)).join(", ") ?? t("tickets.all")}`}
              onRemove={isDefaultStatuses(selection, isReporter) ? undefined : () => clearField("statuses")}
            />
          )}
          {selection.priorities.length > 0 && (
            <FilterChip label={`${t("tickets.col.priority")}: ${PRIORITIES.filter((p) => selection.priorities.includes(p)).map((p) => tEnum("priority", p)).join(", ")}`} onRemove={() => clearField("priorities")} />
          )}
          {selection.departmentIds.length > 0 && (
            <FilterChip label={`${t("ticketDetail.department")}: ${namesOf(selection.departmentIds, departments, t("tickets.noDepartment"), t("tickets.myDepartments"))}`} onRemove={() => clearField("departmentIds")} />
          )}
          {selection.organizationIds.length > 0 && (
            <FilterChip label={`${t("ticketDetail.organization")}: ${namesOf(selection.organizationIds, orgs, t("tickets.noOrganization"))}`} onRemove={() => clearField("organizationIds")} />
          )}
          {selection.categoryIds.length > 0 && (
            <FilterChip label={`${t("ticketDetail.category")}: ${namesOf(selection.categoryIds, categories, t("tickets.noCategory"))}`} onRemove={() => clearField("categoryIds")} />
          )}
          {selection.reopened && (
            <FilterChip label={`↺ ${t("reopen.filter")}`} onRemove={() => clearField("reopened")} />
          )}
          {selection.tagIds.length > 0 && (
            <FilterChip label={`${t("tickets.col.tags")}: ${namesOf(selection.tagIds, tags, "")}`} onRemove={() => clearField("tagIds")} />
          )}
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="text-exs text-subtle hover:text-body cursor-pointer ml-1">
              {t("tickets.clearAll")}
            </button>
          )}
        </div>
      )}

      {isBoard ? (
        <div className="flex-1 overflow-hidden">
          <TicketBoard
            workspaceSlug={workspaceSlug!}
            refreshTrigger={boardKey}
            filters={{
              search: filters.search,
              ...selectionParams(false),
              projectId: filterProjectId,
              reporterId: isReporter ? user?.id : undefined,
            }}
            tags={tags}
            members={members}
            categories={categories}
            onTicketClick={(id) => { setSelectedTicketId(id); setTicketMode("view"); }}
            canChangeStatus={can(P.TICKET_CHANGE_STATUS)}
            canMoveToOpen={can(P.TICKET_ASSIGN)}
            canViewAll={can(P.TICKET_VIEW)}
            userId={user?.id}
            onReopenRequest={can(P.TICKET_REOPEN) ? openReopen : undefined}
          />
        </div>
      ) : (
      <>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <TicketBulkActions
          selectedCount={selectedIds.size}
          can={can}
          onChangeStatus={() => { bulk.setBulkStatusModal(true); bulk.setBulkSelectedStatus(""); }}
          onDelete={() => bulk.setConfirmBulkDelete(true)}
          onClear={clearSelection}
        />
      </div>

      {loading && !result ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : !result || result.items.length === 0 ? (
        emptyKind === "no-results" ? (
          <EmptyState
            bordered
            variant="no-results"
            icon="tickets"
            title={t("emptyState.tickets.noResults")}
            description={t("emptyState.noResultsHint")}
            action={activeFilterCount > 0 && <Button size="sm" color="light" onClick={clearAllFilters}>{t("emptyState.clearFilters")}</Button>}
          />
        ) : emptyKind === "empty" ? (
          <EmptyState
            bordered
            icon="tickets"
            title={t("emptyState.tickets.title")}
            description={t("emptyState.tickets.description")}
            action={<Button size="sm" onClick={() => setShowCreate(true)}>{t("tickets.new")}</Button>}
          />
        ) : (
          <EmptyState bordered icon="tickets" title={t("emptyState.tickets.viewTitle")} />
        )
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {/* While the next page loads, the rows stay in place, dimmed, so the page does not jump */}
          <div ref={tableTopRef} aria-busy={loading || undefined} className="relative bg-surface border border-border-card rounded-lg">
          {loading && <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-primary-600 animate-pulse rounded-t-lg z-10" />}
          <div className={clsx("overflow-x-auto rounded-lg transition-opacity", loading && "opacity-50 pointer-events-none")}>
            <table className="w-full">
              <thead>
                <SortableContext items={order} strategy={horizontalListSortingStrategy}>
                <tr className="border-b border-border-card bg-surface-hover">
                  {!isReporter && (
                    <th className="pl-4 pr-1 py-3 w-10">
                      <button
                        onClick={() => toggleSelectAll(tickets.map((t) => t.id))}
                        className={clsx(
                          "w-4 h-4 rounded border transition-colors flex items-center justify-center cursor-pointer",
                          tickets.length > 0 && selectedIds.size === tickets.length
                            ? "bg-primary-600 border-primary-600"
                            : "border-border-input hover:border-primary-400",
                        )}
                      >
                        {tickets.length > 0 && selectedIds.size === tickets.length && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </button>
                    </th>
                  )}
                  {reorder(COLUMNS).map((col) => (
                    <SortableTh key={col.key} id={col.key} sortable={col.sortable} onClick={() => col.sortable && toggleSort(col.key)}>
                      {t(col.labelKey as any)}
                      {filters.sortBy === col.key && (
                        <span className="text-primary">{filters.sortOrder === "ASC" ? "↑" : "↓"}</span>
                      )}
                    </SortableTh>
                  ))}
                  <th className="px-2 py-3 bg-surface-hover sticky right-0 w-10" />
                </tr>
                </SortableContext>
              </thead>
              <tbody>
                {result.items.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-border-row hover:bg-surface-hover/50 cursor-pointer transition-colors"
                    onClick={() => { setSelectedTicketId(ticket.id); setTicketMode("view"); }}
                  >
                    {!isReporter && (
                      <td className="pl-4 pr-1 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelect(ticket.id)}
                          className={clsx(
                            "w-4 h-4 rounded border transition-colors flex items-center justify-center cursor-pointer",
                            selectedIds.has(ticket.id) ? "bg-primary-600 border-primary-600" : "border-border-input hover:border-primary-400",
                          )}
                        >
                          {selectedIds.has(ticket.id) && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </button>
                      </td>
                    )}
                    {reorder(COLUMNS).map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        {col.key === "ticketNumber" && <span className="text-sm text-muted font-body-medium whitespace-nowrap">{ticket.ticketNumber}</span>}
                        {col.key === "name" && (
                          <div className="flex items-center gap-1.5 max-w-xs">
                            {(ticket.firstResponseBreached || ticket.resolutionBreached) && ticket.status !== "resolved" && ticket.status !== "discarded" && (
                              <span
                                className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse"
                                title={t("ticketDetail.slaBreached")}
                              />
                            )}
                            <p className="text-sm font-body-semibold text-heading truncate">{ticket.name}</p>
                            {!!ticket.reopenCount && (
                              <span
                                title={t("reopen.listBadge").replace("{count}", String(ticket.reopenCount))}
                                aria-label={t("reopen.listBadge").replace("{count}", String(ticket.reopenCount))}
                                className="shrink-0 text-exs font-body-semibold px-1 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                              >
                                ↺ {ticket.reopenCount}
                              </span>
                            )}
                          </div>
                        )}
                        {col.key === "organization" && (
                          <span className="text-xs text-muted whitespace-nowrap">{ticket.organizationId ? orgMap.get(ticket.organizationId)?.name ?? "—" : "—"}</span>
                        )}
                        {col.key === "department" && (
                          <span className="text-xs text-muted whitespace-nowrap">{ticket.departmentId ? deptMap.get(ticket.departmentId)?.name ?? "—" : "—"}</span>
                        )}
                        {col.key === "category" && (() => {
                          const cat = categories.find((c) => c.id === ticket.categoryId);
                          return <StatusBadge label={cat?.name ?? "—"} color={(cat?.color as any) || "gray"} size="xs" />;
                        })()}
                        {col.key === "priority" && <StatusBadge label={tEnum("priority", ticket.priority)} color={PRIORITY_COLORS[ticket.priority] || "gray"} size="xs" />}
                        {col.key === "status" && <StatusBadge label={tEnum("status", ticket.status)} color={STATUS_COLORS[ticket.status] || "gray"} size="xs" />}
                        {col.key === "tags" && (() => {
                          // One line, so every row keeps the same height: the first few, then "+N" with the rest on hover
                          const rowTags = ticket.tagIds.map((id) => tagMap.get(id)).filter((tag): tag is Tag => !!tag);
                          const shown = rowTags.slice(0, VISIBLE_ROW_TAGS);
                          const rest = rowTags.slice(VISIBLE_ROW_TAGS);
                          return (
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              {shown.map((tag) => (
                                <span key={tag.id} className="px-1.5 py-0.5 rounded text-exs font-body-medium text-white" style={{ backgroundColor: tag.color || "#6366f1" }}>
                                  {tag.name}
                                </span>
                              ))}
                              {rest.length > 0 && (
                                <span title={rest.map((tag) => tag.name).join(", ")} className="px-1.5 py-0.5 rounded text-exs font-body-medium bg-surface-hover text-muted cursor-default">
                                  +{rest.length}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                        {col.key === "createdAt" && <span className="text-xs text-muted whitespace-nowrap">{ticket.createdAt ? formatDate(ticket.createdAt) : "-"}</span>}
                      </td>
                    ))}
                    <td className="px-2 py-3 sticky right-0 bg-surface">
                      <ActionMenu items={(() => {
                        const hasDirectAccess = ticket.assigneeId === user?.id || ticket.reporterId === user?.id || ticket.status === "open" || can(P.TICKET_VIEW);
                        const isAssigneeOrCreator = ticket.assigneeId === user?.id || ticket.reporterId === user?.id;
                        const isOpen = ticket.status === "open";
                        const isClosed = ticket.status === "resolved" || ticket.status === "discarded";
                        const items = [
                          { label: t("tickets.view"), onClick: () => { setSelectedTicketId(ticket.id); setTicketMode("view"); } },
                          ...(!isReporter && hasDirectAccess ? [{ label: t("tickets.edit"), onClick: () => { setSelectedTicketId(ticket.id); setTicketMode("edit"); } }] : []),
                          // Agents only on tickets assigned to them; an open one is picked up instead
                          ...(can(P.TICKET_CHANGE_STATUS) && canMoveTicketStatus(ticket, user?.id, can) ? [{ label: t("tickets.changeStatus"), onClick: () => { bulk.setChangeStatusTicket(ticket); bulk.setSelectedStatus(ticket.status); } }] : []),
                          // Closed: back to work only by reopening, with a reason
                          ...(hasDirectAccess && canReopenTicket(ticket, can) ? [{ label: t("reopen.actionEllipsis"), onClick: () => openReopen(ticket.id) }] : []),
                          // Admin/Supervisor: Assign (any ticket, any state except closed)
                          ...(can(P.TICKET_ASSIGN) && !isClosed ? [{ label: t("tickets.assign"), onClick: () => { setAssignTicketId(ticket.id); setAssignTarget(ticket.assigneeId); setAssignMode("assign"); } }] : []),
                          // Pickup into a chosen status (only open tickets); it assigns the ticket to whoever picks it up
                          ...(can(P.TICKET_PICKUP) && isOpen ? [{ label: t("tickets.pickup"), onClick: () => { setPickupTarget(ticket); setPickupStatus(PICKUP_STATUSES[0]); } }] : []),
                          // Agent: discard an open ticket straight from the queue (spam, duplicates)
                          ...(canDiscardFromQueue(ticket, user?.id, can) ? [{ label: t("tickets.discard"), danger: true, onClick: () => setDiscardTarget(ticket) }] : []),
                          // Agent: Transfer (only if assignee or creator, not closed)
                          ...(!can(P.TICKET_ASSIGN) && can(P.TICKET_TRANSFER) && isAssigneeOrCreator && !isClosed ? [{ label: t("tickets.transfer"), onClick: () => { setAssignTicketId(ticket.id); setAssignTarget(ticket.assigneeId); setAssignMode("transfer"); } }] : []),
                          // Agent: let go of their own ticket, back to the queue
                          ...(!can(P.TICKET_ASSIGN) && ticket.assigneeId === user?.id && !isClosed ? [{ label: t("ticketDetail.release"), onClick: () => setReleaseTarget(ticket) }] : []),
                          ...(can(P.TICKET_DELETE) && hasDirectAccess ? [{ label: t("tickets.delete"), onClick: () => bulk.setDeleteTicketId(ticket.id), danger: true }] : []),
                        ];
                        return items;
                      })()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={result.page}
            total={result.total}
            limit={result.limit}
            onPageChange={changePage}
            onLimitChange={setLimit}
            noun={t("pagination.tickets")}
          />
          </div>
          </DndContext>
        </>
      )}
      </>
      )}

      {/* Single ticket status change modal */}
      {bulk.changeStatusTicket && !bulk.showDiscardReason && (
        <TicketStatusModal
          subtitle={bulk.changeStatusTicket.name}
          selected={bulk.selectedStatus}
          currentStatus={bulk.changeStatusTicket.status}
          statuses={statusesFrom(bulk.changeStatusTicket.status)}
          assigneeId={bulk.changeStatusTicket.assigneeId}
          onReopen={canReopenTicket(bulk.changeStatusTicket, can) ? () => { const id = bulk.changeStatusTicket!.id; bulk.setChangeStatusTicket(null); bulk.setSelectedStatus(""); openReopen(id); } : undefined}
          onSelect={bulk.setSelectedStatus}
          onConfirm={bulk.handleChangeStatus}
          onClose={() => { bulk.setChangeStatusTicket(null); bulk.setSelectedStatus(""); }}
          t={t}
          tEnum={tEnum}
        />
      )}

      {reopenTarget && workspaceSlug && (
        <ReopenTicketModal
          ticket={reopenTarget}
          members={members}
          canChooseAssignee={can(P.TICKET_ASSIGN)}
          droppedOn={reopenDroppedOn}
          onCancel={() => { setReopenTarget(null); setBoardKey((k) => k + 1); }}
          onConfirm={async (data) => {
            try {
              await reopenTicket(workspaceSlug, reopenTarget.id, data);
              toast.success(t("reopen.done"));
              setReopenTarget(null);
              fetchTickets();
              setBoardKey((k) => k + 1);
            } catch { toast.error(t("reopen.error")); }
          }}
        />
      )}

      {/* Pickup into a chosen status */}
      {pickupTarget && (
        <TicketStatusModal
          title={t("tickets.pickup")}
          subtitle={pickupTarget.name}
          selected={pickupStatus}
          statuses={PICKUP_STATUSES}
          onSelect={setPickupStatus}
          onConfirm={async () => {
            try {
              await pickupTicket(workspaceSlug!, pickupTarget.id, pickupStatus);
              toast.success(t("tickets.pickedUp"));
              fetchTickets();
              setBoardKey((k) => k + 1);
            } catch {
              toast.error(t("tickets.pickupError"));
            }
            setPickupTarget(null);
          }}
          onClose={() => setPickupTarget(null)}
          t={t}
          tEnum={tEnum}
        />
      )}

      {/* Discard straight from the queue */}
      {discardTarget && (
        <TicketDiscardReasonModal
          t={t}
          tEnum={tEnum}
          onCancel={() => setDiscardTarget(null)}
          onSelectReason={async (reason) => {
            const target = discardTarget;
            setDiscardTarget(null);
            try {
              await changeTicketStatus(workspaceSlug!, target.id, "discarded", reason);
              toast.success(t("tickets.statusUpdated"));
              fetchTickets();
            } catch {
              toast.error(t("tickets.changeStatusError"));
            }
          }}
        />
      )}

      {/* Single ticket discard reason modal */}
      {bulk.showDiscardReason && bulk.changeStatusTicket && (
        <Sheet size="sm" onClose={() => { bulk.setShowDiscardReason(false); bulk.setDiscardReason(""); }}>
          <h3 className="text-base font-body-bold text-heading mb-1">{t("ticketDetail.discardReasonTitle")}</h3>
          <p className="text-sm text-muted mb-4">{t("ticketDetail.discardReasonMessage")}</p>
          <div className="flex flex-col gap-2">
            {(["duplicate", "spam", "no-response", "wont-fix"] as const).map((reason) => (
              <button
                key={reason}
                onClick={async () => {
                  try {
                    await changeTicketStatus(workspaceSlug!, bulk.changeStatusTicket!.id, "discarded", reason);
                    toast.success(t("tickets.statusUpdated"));
                    bulk.setChangeStatusTicket(null);
                    bulk.setSelectedStatus("");
                    bulk.setDiscardReason("");
                    bulk.setShowDiscardReason(false);
                    fetchTickets();
                  } catch {
                    toast.error(t("tickets.changeStatusError"));
                  }
                }}
                className="w-full text-left px-3 py-2 rounded text-sm hover:bg-surface-hover transition-colors cursor-pointer text-body"
              >
                {tEnum("discardReason", reason)}
              </button>
            ))}
          </div>
          <button onClick={() => { bulk.setShowDiscardReason(false); bulk.setDiscardReason(""); }} className="mt-3 text-xs text-subtle hover:text-secondary-text cursor-pointer">
            {t("ticketDetail.cancel")}
          </button>
        </Sheet>
      )}

      {/* Bulk status change modal */}
      {bulk.bulkStatusModal && !bulk.bulkDiscardReason && (
        <Sheet size="sm" onClose={() => { bulk.setBulkStatusModal(false); bulk.setBulkSelectedStatus(""); }}>
          <h3 className="text-base font-body-bold text-heading mb-1">{t("tickets.changeStatus")}</h3>
          <p className="text-sm text-muted mb-4">{selectedIds.size} {t("tickets.ticketCount")}</p>
          <div className="flex flex-col gap-1.5 mb-6">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => bulk.setBulkSelectedStatus(s)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-body-medium transition-colors cursor-pointer ${bulk.bulkSelectedStatus === s ? "bg-surface-active text-primary border border-primary/30" : "text-secondary-text hover:bg-surface-hover border border-transparent"}`}>
                {tEnum("status", s)}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" color="light" onClick={() => { bulk.setBulkStatusModal(false); bulk.setBulkSelectedStatus(""); }}>{t("ticketDetail.cancel")}</Button>
            <Button size="sm" color="primary" disabled={!bulk.bulkSelectedStatus} onClick={() => bulk.handleBulkStatusChange()}>{t("ticketDetail.confirmSave")}</Button>
          </div>
        </Sheet>
      )}

      {/* Bulk discard reason modal */}
      {bulk.bulkDiscardReason && (
        <Sheet size="sm" onClose={() => bulk.setBulkDiscardReason(false)}>
          <h3 className="text-base font-body-bold text-heading mb-1">{t("ticketDetail.discardReasonTitle")}</h3>
          <p className="text-sm text-muted mb-4">{t("ticketDetail.discardReasonMessage")}</p>
          <div className="flex flex-col gap-2">
            {(["duplicate", "spam", "no-response", "wont-fix"] as const).map((reason) => (
              <button key={reason} onClick={() => bulk.handleBulkStatusChange(reason)} className="w-full text-left px-3 py-2 rounded text-sm hover:bg-surface-hover transition-colors cursor-pointer text-body">
                {tEnum("discardReason", reason)}
              </button>
            ))}
          </div>
          <button onClick={() => bulk.setBulkDiscardReason(false)} className="mt-3 text-xs text-subtle hover:text-secondary-text cursor-pointer">{t("ticketDetail.cancel")}</button>
        </Sheet>
      )}

      {bulk.confirmBulkDelete && (
        <ConfirmModal title={t("tickets.delete")} message={`${selectedIds.size} ${t("tickets.bulkDeleteConfirm")}`} confirmLabel={t("common.delete")} danger onConfirm={() => { bulk.setConfirmBulkDelete(false); bulk.handleBulkDelete(); }} onCancel={() => bulk.setConfirmBulkDelete(false)} />
      )}

      {bulk.deleteTicketId && (
        <ConfirmModal
          title={t("tickets.delete")}
          message={t("ticketDetail.deleteMessage")}
          confirmLabel={t("common.delete")}
          danger
          onConfirm={() => {
            deleteTicket(workspaceSlug!, bulk.deleteTicketId!)
              .then(() => { toast.success(t("tickets.deleted")); fetchTickets(); })
              .catch(() => toast.error(t("tickets.deleteError")));
            bulk.setDeleteTicketId(null);
          }}
          onCancel={() => bulk.setDeleteTicketId(null)}
        />
      )}

      {assignTicketId && workspaceSlug && (
        <TicketMemberPickerModal
          mode={assignMode}
          assignableMembers={members.filter((m) => canBeAssignee(m.role))}
          currentUserId={user?.id ?? ""}
          initialTarget={assignTarget}
          allowUnassign={!!assignTarget}
          t={t}
          onClose={() => { setAssignTicketId(null); setAssignTarget(null); }}
          onSubmit={async (target) => {
            try {
              if (assignMode === "transfer") {
                if (!target) return;
                await transferTicket(workspaceSlug, assignTicketId, target);
                toast.success(t("tickets.transferred"));
              } else {
                await assignTicket(workspaceSlug, assignTicketId, target);
                toast.success(t(target ? "tickets.assigned" : "ticketDetail.released"));
              }
              fetchTickets();
              setBoardKey((k) => k + 1);
            } catch { toast.error(t("tickets.assignError")); }
            setAssignTicketId(null);
            setAssignTarget(null);
          }}
        />
      )}

      {releaseTarget && workspaceSlug && (
        <ConfirmModal
          title={t("ticketDetail.releaseTitle")}
          message={t("ticketDetail.releaseMessage")}
          confirmLabel={t("ticketDetail.release")}
          onConfirm={() => {
            const id = releaseTarget.id;
            setReleaseTarget(null);
            assignTicket(workspaceSlug, id, null)
              .then(() => { toast.success(t("ticketDetail.released")); fetchTickets(); setBoardKey((k) => k + 1); })
              .catch(() => toast.error(t("tickets.assignError")));
          }}
          onCancel={() => setReleaseTarget(null)}
        />
      )}

      {showDiscard && (
        <ConfirmModal title={t("discard.title")} message={t("discard.message")} confirmLabel={t("discard.confirm")} danger onConfirm={() => { setShowDiscard(false); setShowCreate(false); setCreateDirty(false); }} onCancel={() => setShowDiscard(false)} />
      )}

      {showCreate && workspaceSlug && (
        <Sheet onClose={handleCreateClose}>
          <Suspense fallback={<PageLoader fullScreen={false} />}>
            <TicketCreatePage
              workspaceSlugProp={workspaceSlug}
              initialProjectId={filterProjectId}
              onCreated={(id) => { setShowCreate(false); setCreateDirty(false); if (id) setSelectedTicketId(id); fetchTickets(); setBoardKey((k) => k + 1); }}
              onClose={handleCreateClose}
              onDirtyChange={setCreateDirty}
            />
          </Suspense>
        </Sheet>
      )}

      {selectedTicketId && workspaceSlug && (
        <Sheet hideClose onClose={() => { if (ticketDirty) { fetchTickets(); setBoardKey((k) => k + 1); } setSelectedTicketId(null); setTicketDirty(false); }}>
          <Suspense fallback={<PageLoader fullScreen={false} />}>
            <TicketDetailPage
              workspaceSlugProp={workspaceSlug}
              ticketIdProp={selectedTicketId}
              onClose={() => { if (ticketDirty) { fetchTickets(); setBoardKey((k) => k + 1); } setSelectedTicketId(null); setTicketDirty(false); }}
              onDirtyChange={setTicketDirty}
              initialMode={ticketMode}
            />
          </Suspense>
        </Sheet>
      )}
    </div>
  );
}

/** The names of the chosen items, in the order they were chosen; "none" and "mine" read as their own labels. */
function namesOf(ids: string[], items: { id: string; name: string }[], noneLabel: string, mineLabel = ""): string {
  return ids.map((id) => (id === FILTER_NONE ? noneLabel : id === FILTER_MINE ? mineLabel : items.find((i) => i.id === id)?.name)).filter(Boolean).join(", ");
}

/** Without `onRemove` the chip only says what applies (the default statuses). */
function FilterChip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-active text-xs text-primary border border-primary/20">
      {label}
      {onRemove && <button onClick={onRemove} aria-label={label} className="hover:text-red-500 cursor-pointer transition-colors">✕</button>}
    </span>
  );
}
