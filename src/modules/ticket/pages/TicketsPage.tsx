import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import clsx from "clsx";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Select from "@modules/app/modules/ui/components/Select/Select";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import {
  TicketListItem,
  TicketFilters,
  listTickets,
} from "../services/ticket.service";
import {
  PRIORITIES,
  STATUSES,
  PRIORITY_COLORS,
  STATUS_COLORS,
  CATEGORY_COLORS,
} from "../domain/ticket-enums";
import { PaginatedResult } from "@modules/shared/domain/pagination-result";
import { Tag, listTags } from "@modules/tag/services/tag.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import TicketDetailPage from "./TicketDetailPage";
import TicketCreatePage from "./TicketCreatePage";

interface Column {
  field: string;
  labelKey: "tickets.col.name" | "tickets.col.category" | "tickets.col.priority" | "tickets.col.status" | "tickets.col.tags" | "tickets.col.created";
  sortable: boolean;
}

const COLUMNS: Column[] = [
  { field: "name", labelKey: "tickets.col.name", sortable: true },
  { field: "category", labelKey: "tickets.col.category", sortable: true },
  { field: "priority", labelKey: "tickets.col.priority", sortable: true },
  { field: "status", labelKey: "tickets.col.status", sortable: true },
  { field: "tags", labelKey: "tickets.col.tags", sortable: false },
  { field: "createdAt", labelKey: "tickets.col.created", sortable: true },
];

type Tab = "active" | "closed";

export default function TicketsPage() {
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();
  const { t, tEnum } = useTranslation();

  const [tab, setTab] = useState<Tab>("active");
  const [result, setResult] = useState<PaginatedResult<TicketListItem> | null>(
    null,
  );
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createDirty, setCreateDirty] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);

  const handleCreateClose = useCallback(() => {
    if (createDirty) {
      setShowDiscard(true);
    } else {
      setShowCreate(false);
      setCreateDirty(false);
    }
  }, [createDirty]);
  const [filters, setFilters] = useState<TicketFilters>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  const fetchTickets = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    const params: TicketFilters = { ...filters };
    if (tab === "closed") {
      params.status = "closed";
    } else if (!params.status) {
      params.excludeStatus = "closed";
    }
    if (filterTagIds.length > 0) {
      params.tagIds = filterTagIds;
    }
    listTickets(workspaceSlug, params)
      .then(setResult)
      .catch(() => toast.error("Failed to load tickets"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (workspaceSlug) listTags(workspaceSlug).then(setTags);
  }, [workspaceSlug]);

  useEffect(() => {
    fetchTickets();
  }, [workspaceSlug, filters, filterTagIds, tab]);

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

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const tagMap = new Map(tags.map((t) => [t.id, t]));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-body-bold text-gray-800">{t("tickets.title")}</h2>
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
        >
          {t("tickets.new")}
        </Button>
      </div>

      <div className="flex gap-1 mb-4">
        <button
          onClick={() => { setTab("active"); setFilters({ ...filters, status: undefined, page: 1 }); }}
          className={clsx(
            "px-3 py-1.5 rounded text-sm font-body-medium transition-colors cursor-pointer",
            tab === "active" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100",
          )}
        >
          {t("tickets.active")}
        </button>
        <button
          onClick={() => { setTab("closed"); setFilters({ ...filters, status: undefined, page: 1 }); }}
          className={clsx(
            "px-3 py-1.5 rounded text-sm font-body-medium transition-colors cursor-pointer",
            tab === "closed" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100",
          )}
        >
          {t("tickets.closed")}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        {tab === "active" && (
          <div className="w-40">
            <Select
              options={["all", ...STATUSES.filter((s) => s !== "closed")]}
              label={(s) => (s === "all" ? t("tickets.allStatuses") : tEnum("status", s))}
              value={(s) => s === (filters.status || "all")}
              onChange={(s) =>
                setFilters({
                  ...filters,
                  status: s === "all" ? undefined : s,
                  page: 1,
                })
              }
              placeholder="Status"
            />
          </div>
        )}
        <div className="w-40">
          <Select
            options={["all", ...PRIORITIES]}
            label={(p) => (p === "all" ? t("tickets.allPriorities") : tEnum("priority", p))}
            value={(p) => p === (filters.priority || "all")}
            onChange={(p) =>
              setFilters({
                ...filters,
                priority: p === "all" ? undefined : p,
                page: 1,
              })
            }
            placeholder="Priority"
          />
        </div>

        {tags.length > 0 && (
          <div ref={tagDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              className={clsx(
                "h-max px-3 py-1 rounded-input border-input text-sm text-left cursor-pointer flex items-center gap-2 transition-all",
                filterTagIds.length > 0
                  ? "bg-primary-50 border-primary-300 text-primary"
                  : "bg-white text-gray-400",
              )}
            >
              <span>Tags</span>
              {filterTagIds.length > 0 && (
                <span className="bg-primary text-white text-exs rounded-full w-4 h-4 flex items-center justify-center">
                  {filterTagIds.length}
                </span>
              )}
              <span className="text-xs ml-1">▼</span>
            </button>

            {tagDropdownOpen && (
              <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-56">
                <p className="text-exs text-gray-400 font-body-medium mb-2 uppercase">
                  {t("tickets.filterByTags")}
                </p>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-auto">
                  {tags.map((tag) => {
                    const selected = filterTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          const ids = selected
                            ? filterTagIds.filter((id) => id !== tag.id)
                            : [...filterTagIds, tag.id];
                          setFilterTagIds(ids);
                          setFilters({ ...filters, page: 1 });
                        }}
                        className={clsx(
                          "flex items-center gap-2 px-2 py-1.5 rounded text-xs font-body-medium transition-colors cursor-pointer text-left",
                          selected
                            ? "bg-primary-50 text-primary"
                            : "text-gray-600 hover:bg-gray-50",
                        )}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color || "#6366f1" }}
                        />
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
                {filterTagIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterTagIds([]);
                      setFilters({ ...filters, page: 1 });
                    }}
                    className="text-exs text-gray-400 hover:text-gray-600 mt-2 cursor-pointer"
                  >
                    {t("tickets.clearAll")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner width={24} />
        </div>
      ) : !result || result.items.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-12">
          {t("tickets.empty")}
        </p>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.field}
                      className={clsx(
                        "px-4 py-3 text-left text-xs font-body-semibold text-gray-400 uppercase",
                        col.sortable &&
                          "cursor-pointer hover:text-gray-600 select-none",
                      )}
                      onClick={() => col.sortable && toggleSort(col.field)}
                    >
                      <span className="flex items-center gap-1">
                        {t(col.labelKey)}
                        {filters.sortBy === col.field && (
                          <span className="text-primary">
                            {filters.sortOrder === "ASC" ? "↑" : "↓"}
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.items.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-body-semibold text-gray-800 truncate max-w-xs">
                        {ticket.name}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={tEnum("category", ticket.category)}
                        color={CATEGORY_COLORS[ticket.category] || "gray"}
                        size="xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={tEnum("priority", ticket.priority)}
                        color={PRIORITY_COLORS[ticket.priority] || "gray"}
                        size="xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={tEnum("status", ticket.status)}
                        color={STATUS_COLORS[ticket.status] || "gray"}
                        size="xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {ticket.tagIds.map((tagId) => {
                          const tag = tagMap.get(tagId);
                          if (!tag) return null;
                          return (
                            <span
                              key={tagId}
                              className="px-1.5 py-0.5 rounded text-exs font-body-medium text-white"
                              style={{
                                backgroundColor: tag.color || "#6366f1",
                              }}
                            >
                              {tag.name}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">
                        {formatDate(ticket.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.total > result.limit && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                size="xs"
                color="light"
                disabled={filters.page === 1}
                onClick={() =>
                  setFilters({ ...filters, page: (filters.page ?? 1) - 1 })
                }
              >
                {t("tickets.previous")}
              </Button>
              <span className="text-xs text-gray-500 flex items-center px-2">
                {t("tickets.page")} {result.page} {t("tickets.of")} {Math.ceil(result.total / result.limit)}
              </span>
              <Button
                size="xs"
                color="light"
                disabled={
                  (filters.page ?? 1) >=
                  Math.ceil(result.total / result.limit)
                }
                onClick={() =>
                  setFilters({ ...filters, page: (filters.page ?? 1) + 1 })
                }
              >
                {t("tickets.next")}
              </Button>
            </div>
          )}
        </>
      )}

      {showDiscard && (
        <ConfirmModal
          title={t("discard.title")}
          message={t("discard.message")}
          confirmLabel={t("discard.confirm")}
          danger
          onConfirm={() => {
            setShowDiscard(false);
            setShowCreate(false);
            setCreateDirty(false);
          }}
          onCancel={() => setShowDiscard(false)}
        />
      )}

      {showCreate && workspaceSlug && (
        <Sheet onClose={handleCreateClose}>
          <TicketCreatePage
            workspaceSlugProp={workspaceSlug}
            onCreated={(id) => {
              setShowCreate(false);
              setCreateDirty(false);
              if (id) setSelectedTicketId(id);
              fetchTickets();
            }}
            onClose={handleCreateClose}
            onDirtyChange={setCreateDirty}
          />
        </Sheet>
      )}

      {selectedTicketId && workspaceSlug && (
        <Sheet onClose={() => { setSelectedTicketId(null); fetchTickets(); }}>
          <TicketDetailPage
            workspaceSlugProp={workspaceSlug}
            ticketIdProp={selectedTicketId}
            onClose={() => { setSelectedTicketId(null); fetchTickets(); }}
          />
        </Sheet>
      )}
    </div>
  );
}
