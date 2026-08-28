import { useCallback, useEffect, useMemo, useState } from "react";
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
import Select from "@modules/app/modules/ui/components/Select/Select";
import useUser from "@modules/user/hooks/useUser";
import usePermissions from "@modules/workspace/hooks/usePermissions";
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
} from "../services/ticket.service";
import {
  PRIORITY_COLORS,
  STATUS_COLORS,
  STATUSES,
} from "../domain/ticket-enums";
import { listCategories, listProjects, type TicketCategoryDto, type Project } from "@modules/project/services/project.service";
import { PaginatedResult } from "@modules/shared/domain/pagination-result";
import { Tag, listTags } from "@modules/tag/services/tag.service";
import { Department, listDepartments } from "@modules/department/services/department.service";
import { Organization, listOrganizations } from "@modules/organization/services/organization.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import Toggle from "@modules/app/modules/ui/components/Toggle/Toggle";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import { listMembers, type WorkspaceMember } from "@modules/workspace/services/workspace.service";
import TicketBoard from "../components/TicketBoard";
import TicketDetailPage from "./TicketDetailPage";
import TicketCreatePage from "./TicketCreatePage";
import useWebSocket from "@modules/shared/hooks/useWebSocket";
import useTicketFilters from "../hooks/useTicketFilters";
import useTicketSelection from "../hooks/useTicketSelection";
import useBulkOperations from "../hooks/useBulkOperations";
import TicketFilterBar from "../components/TicketFilterBar";
import TicketBulkActions from "../components/TicketBulkActions";
import useFormatDate from "@modules/app/hooks/useFormatDate";

interface Column {
  key: string;
  labelKey: string;
  sortable: boolean;
}

const BASE_COLUMNS: Column[] = [
  { key: "ticketNumber", labelKey: "tickets.col.number", sortable: false },
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

  const {
    filters, setFilters, filterTagIds, setFilterTagIds,
    filterProjectId, setFilterProjectId,
    filterDepartmentId, setFilterDepartmentId,
    filterOrganizationId, setFilterOrganizationId,
    filterCategoryId, setFilterCategoryId,
    tab, setTab, viewMode, setViewMode, isBoard,
    toggleSort, activeFilterCount, clearAllFilters,
  } = useTicketFilters();

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
    if (orgs.length > 0) {
      cols.splice(2, 0, { key: "organization", labelKey: "ticketDetail.organization", sortable: false });
    }
    return cols;
  }, [orgs.length]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketMode, setTicketMode] = useState<"view" | "edit">("view");
  const [ticketDirty, setTicketDirty] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createDirty, setCreateDirty] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [assignTicketId, setAssignTicketId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [assignMode, setAssignMode] = useState<"assign" | "transfer">("assign");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) {
      setSelectedTicketId(openId);
      setTicketMode("view");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchTickets = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    const params: TicketFilters = { ...filters };
    if (tab === "resolved") {
      params.status = "resolved";
    } else if (tab === "discarded") {
      params.status = "discarded";
    } else if (!params.status) {
      params.excludeStatus = "resolved,discarded";
    }
    if (filterTagIds.length > 0) params.tagIds = filterTagIds;
    if (filterDepartmentId) params.departmentId = filterDepartmentId;
    if (filterOrganizationId) params.organizationId = filterOrganizationId;
    if (filterProjectId) params.projectId = filterProjectId;
    if (filterCategoryId) params.categoryId = filterCategoryId;
    if (isReporter && user) params.reporterId = user.id;
    listTickets(workspaceSlug, params)
      .then(setResult)
      .catch(() => toast.error("Failed to load tickets"))
      .finally(() => setLoading(false));
  };

  const bulk = useBulkOperations({
    workspaceSlug,
    selectedIds,
    clearSelection,
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

  useEffect(() => {
    if (workspaceSlug) {
      listTags(workspaceSlug).then(setTags);
      listDepartments(workspaceSlug).then(setDepartments).catch(() => {});
      listOrganizations(workspaceSlug).then(setOrgs).catch(() => {});
      listMembers(workspaceSlug).then(setMembers);
      listCategories(workspaceSlug).then(setCategories).catch(() => {});
      listProjects(workspaceSlug).then(setProjects).catch(() => {});
    }
  }, [workspaceSlug]);

  useEffect(() => {
    if (!permLoading) fetchTickets();
    setSelectedIds(new Set());
  }, [workspaceSlug, filters, filterTagIds, filterDepartmentId, filterOrganizationId, filterProjectId, filterCategoryId, tab, permLoading, isReporter, viewMode]);

  const refetchAll = useCallback(() => {
    fetchTickets();
    setBoardKey((k) => k + 1);
  }, [workspaceSlug, filters, filterTagIds, filterDepartmentId, filterOrganizationId, filterProjectId, filterCategoryId, tab, permLoading, isReporter, viewMode]);

  useWebSocket(workspaceSlug, {
    "ticket.created": refetchAll,
    "ticket.statusChanged": refetchAll,
    "ticket.assigned": refetchAll,
    "comment.created": refetchAll,
  });

  const tickets = result?.items ?? [];
  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const orgMap = new Map(orgs.map((o) => [o.id, o]));

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

      {/* Tier 2: Status tabs + Search + Filters popover */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1 shrink-0">
          {(["active", "resolved", "discarded"] as const).map((t_) => (
            <button
              key={t_}
              onClick={() => { setTab(t_); setFilters({ ...filters, status: undefined, page: 1 }); }}
              className={clsx(
                "px-2.5 py-1 rounded text-xs font-body-medium transition-colors cursor-pointer whitespace-nowrap",
                tab === t_ ? "bg-primary-600 text-on-primary" : "text-muted hover:bg-surface-hover",
              )}
            >
              {t(`tickets.${t_}`)}
            </button>
          ))}
        </div>
        <TicketFilterBar
          tab={tab}
          filters={filters}
          setFilters={setFilters}
          filterTagIds={filterTagIds}
          setFilterTagIds={setFilterTagIds}
          filterDepartmentId={filterDepartmentId}
          setFilterDepartmentId={setFilterDepartmentId}
          filterOrganizationId={filterOrganizationId}
          setFilterOrganizationId={setFilterOrganizationId}
          filterCategoryId={filterCategoryId}
          setFilterCategoryId={setFilterCategoryId}
          tags={tags}
          departments={departments}
          organizations={orgs}
          categories={categories}
          activeFilterCount={activeFilterCount}
          isBoard={isBoard}
        />
      </div>

      {/* Tier 3: Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {filters.priority && (
            <FilterChip label={`${t("tickets.col.priority")}: ${tEnum("priority", filters.priority)}`} onRemove={() => setFilters((f) => ({ ...f, priority: undefined, page: 1 }))} />
          )}
          {filters.status && (
            <FilterChip label={`${t("tickets.col.status")}: ${tEnum("status", filters.status)}`} onRemove={() => setFilters((f) => ({ ...f, status: undefined, page: 1 }))} />
          )}
          {filterDepartmentId && (
            <FilterChip label={`${t("ticketDetail.department")}: ${departments.find((d) => d.id === filterDepartmentId)?.name ?? ""}`} onRemove={() => setFilterDepartmentId(undefined)} />
          )}
          {filterOrganizationId && (
            <FilterChip label={`${t("ticketDetail.organization")}: ${orgs.find((o) => o.id === filterOrganizationId)?.name ?? ""}`} onRemove={() => setFilterOrganizationId(undefined)} />
          )}
          {filterCategoryId && (
            <FilterChip label={`${t("ticketDetail.category")}: ${categories.find((c) => c.id === filterCategoryId)?.name ?? ""}`} onRemove={() => setFilterCategoryId(undefined)} />
          )}
          {filterTagIds.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            return tag ? <FilterChip key={tagId} label={tag.name} onRemove={() => { setFilterTagIds((ids) => ids.filter((id) => id !== tagId)); setFilters((f) => ({ ...f, page: 1 })); }} /> : null;
          })}
          <button onClick={clearAllFilters} className="text-exs text-subtle hover:text-body cursor-pointer ml-1">
            {t("tickets.clearAll")}
          </button>
        </div>
      )}

      {isBoard ? (
        <div className="flex-1 overflow-hidden">
          <TicketBoard
            workspaceSlug={workspaceSlug!}
            refreshTrigger={boardKey}
            filters={{
              search: filters.search,
              priority: filters.priority,
              tagIds: filterTagIds.length > 0 ? filterTagIds : undefined,
              departmentId: filterDepartmentId,
              organizationId: filterOrganizationId,
              projectId: filterProjectId,
              categoryId: filterCategoryId,
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

      {loading ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : !result || result.items.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">{t("tickets.empty")}</p>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="bg-surface border border-border-card rounded-lg overflow-x-auto">
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
                        {col.key === "ticketNumber" && <span className="text-sm text-muted font-body-medium">#{ticket.ticketNumber}</span>}
                        {col.key === "name" && (
                          <div className="flex items-center gap-1.5 max-w-xs">
                            {(ticket.firstResponseBreached || ticket.resolutionBreached) && ticket.status !== "resolved" && ticket.status !== "discarded" && (
                              <span
                                className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse"
                                title={t("ticketDetail.slaBreached")}
                              />
                            )}
                            <p className="text-sm font-body-semibold text-heading truncate">{ticket.name}</p>
                          </div>
                        )}
                        {col.key === "organization" && (
                          <span className="text-xs text-muted">{ticket.organizationId ? orgMap.get(ticket.organizationId)?.name ?? "—" : "—"}</span>
                        )}
                        {col.key === "category" && (() => {
                          const cat = categories.find((c) => c.id === ticket.categoryId);
                          return <StatusBadge label={cat?.name ?? "—"} color={(cat?.color as any) || "gray"} size="xs" />;
                        })()}
                        {col.key === "priority" && <StatusBadge label={tEnum("priority", ticket.priority)} color={PRIORITY_COLORS[ticket.priority] || "gray"} size="xs" />}
                        {col.key === "status" && <StatusBadge label={tEnum("status", ticket.status)} color={STATUS_COLORS[ticket.status] || "gray"} size="xs" />}
                        {col.key === "tags" && (
                          <div className="flex flex-wrap gap-1">
                            {ticket.tagIds.map((tagId) => {
                              const tag = tagMap.get(tagId);
                              if (!tag) return null;
                              return (
                                <span key={tagId} className="px-1.5 py-0.5 rounded text-exs font-body-medium text-white" style={{ backgroundColor: tag.color || "#6366f1" }}>
                                  {tag.name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {col.key === "createdAt" && <span className="text-xs text-muted">{ticket.createdAt ? formatDate(ticket.createdAt) : "-"}</span>}
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
                          ...(can(P.TICKET_CHANGE_STATUS) && hasDirectAccess ? [{ label: t("tickets.changeStatus"), onClick: () => { bulk.setChangeStatusTicket(ticket); bulk.setSelectedStatus(ticket.status); } }] : []),
                          // Admin/Supervisor: Assign (any ticket, any state except closed)
                          ...(can(P.TICKET_ASSIGN) && !isClosed ? [{ label: t("tickets.assign"), onClick: () => { setAssignTicketId(ticket.id); setAssignTarget(ticket.assigneeId); setAssignMode("assign"); } }] : []),
                          // Agent: Pickup (only open tickets)
                          ...(!can(P.TICKET_ASSIGN) && can(P.TICKET_PICKUP) && isOpen ? [{ label: t("tickets.pickup"), onClick: () => { pickupTicket(workspaceSlug!, ticket.id).then(() => { toast.success(t("tickets.pickedUp")); fetchTickets(); setBoardKey((k) => k + 1); }).catch(() => toast.error("Failed to pick up")); } }] : []),
                          // Agent: Transfer (only if assignee or creator, not closed)
                          ...(!can(P.TICKET_ASSIGN) && can(P.TICKET_TRANSFER) && isAssigneeOrCreator && !isClosed ? [{ label: t("tickets.transfer"), onClick: () => { setAssignTicketId(ticket.id); setAssignTarget(ticket.assigneeId); setAssignMode("transfer"); } }] : []),
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
          </DndContext>

          {result.total > result.limit && (
            <div className="flex justify-center gap-2 mt-6">
              <Button size="xs" color="light" disabled={filters.page === 1} onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) - 1 })}>
                {t("tickets.previous")}
              </Button>
              <span className="text-xs text-muted flex items-center px-2">
                {t("tickets.page")} {result.page} {t("tickets.of")} {Math.ceil(result.total / result.limit)}
              </span>
              <Button size="xs" color="light" disabled={(filters.page ?? 1) >= Math.ceil(result.total / result.limit)} onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) + 1 })}>
                {t("tickets.next")}
              </Button>
            </div>
          )}
        </>
      )}
      </>
      )}

      {/* Single ticket status change modal */}
      {bulk.changeStatusTicket && !bulk.showDiscardReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { bulk.setChangeStatusTicket(null); bulk.setSelectedStatus(""); }}>
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-body-bold text-heading mb-1">{t("tickets.changeStatus")}</h3>
            <p className="text-sm text-muted mb-4">{bulk.changeStatusTicket.name}</p>
            <div className="flex flex-col gap-1.5 mb-6">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => bulk.setSelectedStatus(s)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-body-medium transition-colors cursor-pointer ${bulk.selectedStatus === s ? "bg-surface-active text-primary border border-primary/30" : "text-secondary-text hover:bg-surface-hover border border-transparent"}`}>
                  {tEnum("status", s)}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" color="light" onClick={() => { bulk.setChangeStatusTicket(null); bulk.setSelectedStatus(""); }}>{t("ticketDetail.cancel")}</Button>
              <Button size="sm" color="primary" disabled={!bulk.selectedStatus || bulk.selectedStatus === bulk.changeStatusTicket.status} onClick={bulk.handleChangeStatus}>{t("ticketDetail.confirmSave")}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Single ticket discard reason modal */}
      {bulk.showDiscardReason && bulk.changeStatusTicket && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => { bulk.setShowDiscardReason(false); bulk.setDiscardReason(""); }}>
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-body-bold text-heading mb-1">{t("ticketDetail.discardReasonTitle")}</h3>
            <p className="text-sm text-muted mb-4">{t("ticketDetail.discardReasonMessage")}</p>
            <div className="flex flex-col gap-2">
              {(["duplicate", "spam", "no-response", "wont-fix"] as const).map((reason) => (
                <button
                  key={reason}
                  onClick={async () => {
                    try {
                      await changeTicketStatus(workspaceSlug!, bulk.changeStatusTicket!.id, "discarded", reason);
                      toast.success(t("ticketDetail.status") + " updated");
                      bulk.setChangeStatusTicket(null);
                      bulk.setSelectedStatus("");
                      bulk.setDiscardReason("");
                      bulk.setShowDiscardReason(false);
                      fetchTickets();
                    } catch {
                      toast.error("Failed to change status");
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
          </div>
        </div>
      )}

      {/* Bulk status change modal */}
      {bulk.bulkStatusModal && !bulk.bulkDiscardReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { bulk.setBulkStatusModal(false); bulk.setBulkSelectedStatus(""); }}>
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-body-bold text-heading mb-1">{t("tickets.changeStatus")}</h3>
            <p className="text-sm text-muted mb-4">{selectedIds.size} ticket(s)</p>
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
          </div>
        </div>
      )}

      {/* Bulk discard reason modal */}
      {bulk.bulkDiscardReason && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => bulk.setBulkDiscardReason(false)}>
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </div>
      )}

      {bulk.confirmBulkDelete && (
        <ConfirmModal title={t("tickets.delete")} message={`${selectedIds.size} ticket(s) will be deleted.`} confirmLabel={t("common.delete")} danger onConfirm={() => { bulk.setConfirmBulkDelete(false); bulk.handleBulkDelete(); }} onCancel={() => bulk.setConfirmBulkDelete(false)} />
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setAssignTicketId(null); setAssignTarget(null); }} />
          <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-body-bold text-heading mb-1">{t(assignMode === "transfer" ? "tickets.transferTitle" : "tickets.assignTitle")}</h3>
            <p className="text-sm text-muted mb-4">{t(assignMode === "transfer" ? "tickets.transferMessage" : "tickets.assignMessage")}</p>
            <Select
              options={members.filter((m) => m.role !== "reporter")}
              value={(m) => m.userId === assignTarget}
              onChange={(m) => setAssignTarget(m.userId)}
              label={(m) => `${m.firstName} ${m.lastName}`}
              placeholder={t("ticketDetail.selectAssignee")}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <Button size="sm" color="light" onClick={() => { setAssignTicketId(null); setAssignTarget(null); }}>{t("ticketDetail.cancel")}</Button>
              <Button size="sm" color="primary" disabled={!assignTarget} onClick={() => {
                const action = assignMode === "transfer"
                  ? transferTicket(workspaceSlug, assignTicketId, assignTarget!)
                  : assignTicket(workspaceSlug, assignTicketId, assignTarget);
                const successMsg = assignMode === "transfer" ? t("tickets.transferred") : t("tickets.assigned");
                action
                  .then(() => { toast.success(successMsg); fetchTickets(); setBoardKey((k) => k + 1); })
                  .catch(() => toast.error("Failed"));
                setAssignTicketId(null);
                setAssignTarget(null);
              }}>{t(assignMode === "transfer" ? "tickets.transfer" : "tickets.assign")}</Button>
            </div>
          </div>
        </div>
      )}

      {showDiscard && (
        <ConfirmModal title={t("discard.title")} message={t("discard.message")} confirmLabel={t("discard.confirm")} danger onConfirm={() => { setShowDiscard(false); setShowCreate(false); setCreateDirty(false); }} onCancel={() => setShowDiscard(false)} />
      )}

      {showCreate && workspaceSlug && (
        <Sheet onClose={handleCreateClose}>
          <TicketCreatePage
            workspaceSlugProp={workspaceSlug}
            onCreated={(id) => { setShowCreate(false); setCreateDirty(false); if (id) setSelectedTicketId(id); fetchTickets(); setBoardKey((k) => k + 1); }}
            onClose={handleCreateClose}
            onDirtyChange={setCreateDirty}
          />
        </Sheet>
      )}

      {selectedTicketId && workspaceSlug && (
        <Sheet onClose={() => { if (ticketDirty) { fetchTickets(); setBoardKey((k) => k + 1); } setSelectedTicketId(null); setTicketDirty(false); }}>
          <TicketDetailPage
            workspaceSlugProp={workspaceSlug}
            ticketIdProp={selectedTicketId}
            onClose={() => { if (ticketDirty) { fetchTickets(); setBoardKey((k) => k + 1); } setSelectedTicketId(null); setTicketDirty(false); }}
            onDirtyChange={setTicketDirty}
            initialMode={ticketMode}
          />
        </Sheet>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-active text-xs text-primary border border-primary/20">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 cursor-pointer transition-colors">✕</button>
    </span>
  );
}
