import { useCallback, useEffect, useMemo, useState } from "react";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import FilterPopover, { FilterChip, buildInitialState, getActiveFilterCount, getFilterChips, type FilterSection, type FilterState } from "@modules/app/modules/ui/components/FilterPopover/FilterPopover";
import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import { inputClass } from "@modules/app/modules/ui/shared/domain/input-class";
import {
  AuditLogItem,
  AuditLogFilters,
  listAllAuditLog,
} from "../services/audit-log.service";
import { MetadataSummary, MetadataKeyValue, HighlightText } from "./WorkspaceAuditLogPage";

const ACTION_GROUPS: { value: string; group: string }[] = [
  { value: "ticket-created", group: "Ticket" }, { value: "ticket-updated", group: "Ticket" },
  { value: "ticket-status-changed", group: "Ticket" }, { value: "ticket-assigned", group: "Ticket" },
  { value: "ticket-picked-up", group: "Ticket" }, { value: "ticket-transferred", group: "Ticket" },
  { value: "ticket-deleted", group: "Ticket" }, { value: "comment-created", group: "Ticket" },
  { value: "workspace-created", group: "Workspace" }, { value: "workspace-updated", group: "Workspace" },
  { value: "workspace-deleted", group: "Workspace" },
  { value: "member-added", group: "Members" }, { value: "member-removed", group: "Members" },
  { value: "member-role-changed", group: "Members" },
  { value: "user-created", group: "User" }, { value: "user-activated", group: "User" },
  { value: "user-deactivated", group: "User" }, { value: "user-admin-toggled", group: "User" },
  { value: "user-signed-up", group: "User" }, { value: "user-logged-in", group: "User" },
  { value: "user-forgot-password", group: "User" }, { value: "user-reset-password", group: "User" },
  { value: "user-email-verified", group: "User" }, { value: "user-oauth-login", group: "User" },
  { value: "imap-poll-started", group: "Email" }, { value: "imap-poll-completed", group: "Email" },
  { value: "mailbox-created", group: "Email" }, { value: "mailbox-updated", group: "Email" },
  { value: "mailbox-deleted", group: "Email" }, { value: "mailbox-paused", group: "Email" },
  { value: "mailbox-resumed", group: "Email" },
  { value: "email-received", group: "Email" }, { value: "email-sent", group: "Email" },
  { value: "email-send-failed", group: "Email" },
  { value: "email-sender-configured", group: "Email" }, { value: "email-sender-deleted", group: "Email" },
];

const CATEGORIES = [
  "ticket",
  "workspace",
  "user",
  "email",
  "config",
  "knowledge-base",
  "system",
  "billing",
];

const LEVELS = ["info", "warning", "error"];

const SOURCES = ["user", "system", "webhook", "email", "scheduler"];

const CATEGORY_COLORS: Record<string, "primary" | "yellow" | "green" | "red" | "gray" | "blue"> = {
  ticket: "blue",
  workspace: "green",
  user: "primary",
  email: "yellow",
  config: "gray",
  "knowledge-base": "primary",
  system: "red",
  billing: "green",
};

const ACTION_COLORS: Record<string, "primary" | "yellow" | "green" | "red" | "gray" | "blue"> = {
  "ticket-created": "green",
  "ticket-updated": "blue",
  "ticket-status-changed": "yellow",
  "ticket-assigned": "blue",
  "ticket-picked-up": "green",
  "ticket-transferred": "yellow",
  "ticket-deleted": "red",
  "comment-created": "primary",
  "workspace-created": "green",
  "workspace-updated": "blue",
  "workspace-deleted": "red",
  "member-added": "green",
  "member-removed": "red",
  "member-role-changed": "yellow",
  "user-created": "green",
  "user-activated": "green",
  "user-deactivated": "red",
  "user-admin-toggled": "yellow",
  "user-signed-up": "green",
  "user-logged-in": "blue",
  "email-received": "blue",
  "email-sent": "green",
  "email-send-failed": "red",
  "email-sender-configured": "green",
  "email-sender-deleted": "red",
  "mailbox-created": "green",
  "mailbox-updated": "blue",
  "mailbox-deleted": "red",
};

const LEVEL_COLORS: Record<string, string> = {
  info: "text-muted",
  warning: "text-yellow-600",
  error: "text-red-500 font-body-semibold",
};

export default function SystemLogsPage() {
  const { t } = useTranslation();
  const formatDate = useFormatDate();

  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<AuditLogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState("");

  const filterSections: FilterSection[] = useMemo(() => [
    { key: "actions", label: t("auditLog.col.action"), type: "multi", options: ACTION_GROUPS.map(a => ({ value: a.value, label: t(`auditLog.action.${a.value}` as any) || a.value, group: a.group })) },
    { key: "categories", label: t("auditLog.col.category"), type: "multi", options: CATEGORIES.map(c => ({ value: c, label: c })) },
    { key: "levels", label: t("auditLog.col.level"), type: "multi", options: LEVELS.map(l => ({ value: l, label: l })) },
    { key: "sources", label: t("auditLog.col.source"), type: "multi", options: SOURCES.map(s => ({ value: s, label: s })) },
  ], [t]);

  const [filterState, setFilterState] = useState<FilterState>(() => buildInitialState(filterSections));

  const handleFilterChange = (newState: FilterState) => {
    setFilterState(newState);
    const getSelected = (key: string) => {
      const val = newState[key];
      return val?.type === "multi" && val.selected.length > 0 ? val.selected : undefined;
    };
    setFilters({
      ...filters,
      actions: getSelected("actions"),
      categories: getSelected("categories"),
      levels: getSelected("levels"),
      sources: getSelected("sources"),
      page: 1,
    });
  };

  const activeFilterCount = getActiveFilterCount(filterState);
  const filterChips = getFilterChips(filterSections, filterState);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setSelected(null);
  }, []);

  useEffect(() => {
    if (selected) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [selected, handleEscape]);

  const fetchLog = () => {
    setLoading(true);
    listAllAuditLog(filters)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLog();
  }, [filters]);

  const totalPages = Math.ceil(total / (filters.limit ?? 20));

  return (
    <div className="w-full">
      <h2 className="text-lg font-body-bold text-heading mb-4">{t("auditLog.systemTitle")}</h2>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              const val = e.target.value.trim();
              clearTimeout((window as any).__sysAuditSearchTimer);
              (window as any).__sysAuditSearchTimer = setTimeout(() => {
                setFilters(f => ({ ...f, search: val || undefined, page: 1 }));
              }, 500);
            }}
            placeholder={t("auditLog.search")}
            className="w-full pl-8 pr-3 py-1.5 rounded-input border-input bg-surface text-sm text-body placeholder:text-muted focus:outline-none focus:border-primary-400 transition-colors"
          />
        </div>
        <input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined, page: 1 })}
          className={inputClass({ size: "sm", full: false, extra: "!w-36" })}
          placeholder={t("auditLog.filterFrom")}
        />
        <input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined, page: 1 })}
          className={inputClass({ size: "sm", full: false, extra: "!w-36" })}
          placeholder={t("auditLog.filterTo")}
        />
        <div className="ml-auto">
          <FilterPopover sections={filterSections} state={filterState} onChange={handleFilterChange} />
        </div>
      </div>
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {filterChips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              onRemove={() => {
                if (chip.summary) {
                  handleFilterChange({ ...filterState, [chip.sectionKey]: { type: "multi", selected: [] } });
                } else {
                  const val = filterState[chip.sectionKey];
                  if (val?.type === "multi") {
                    handleFilterChange({ ...filterState, [chip.sectionKey]: { type: "multi", selected: val.selected.filter(v => v !== chip.value) } });
                  } else {
                    handleFilterChange({ ...filterState, [chip.sectionKey]: { type: "single", value: undefined } });
                  }
                }
              }}
            />
          ))}
          <button
            onClick={() => { setFilterState(buildInitialState(filterSections)); setFilters({ page: 1, limit: 20 }); }}
            className="text-exs text-subtle hover:text-body cursor-pointer ml-1"
          >
            {t("filters.clearAll")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">{t("auditLog.empty")}</p>
      ) : (
        <>
          <div className="bg-surface border border-border-card rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-card bg-surface-hover">
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("auditLog.col.date")}</th>
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("auditLog.col.level")}</th>
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("auditLog.col.category")}</th>
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("auditLog.col.action")}</th>
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("auditLog.col.entity")}</th>
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("auditLog.col.user")}</th>
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("auditLog.col.details")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border-row">
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${LEVEL_COLORS[item.level] ?? "text-muted"}`}>
                        {t(`auditLog.level.${item.level}` as any)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={item.category}
                        color={CATEGORY_COLORS[item.category] ?? "gray"}
                        size="xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={t(`auditLog.action.${item.action}` as any) ?? item.action}
                        color={ACTION_COLORS[item.action] ?? "gray"}
                        size="xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted">{item.entityType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-body">
                        {item.userName ?? (item.userId ? item.userId.slice(0, 8) + "..." : t("auditLog.system"))}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <MetadataSummary metadata={item.metadata} action={item.action} t={t} search={filters.search} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(item)}
                        className="text-xs text-primary hover:underline cursor-pointer"
                      >
                        {t("auditLog.view")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-muted">
                {t("auditLog.showing")} {items.length} / {total}
              </span>
              <div className="flex gap-1">
                <Button
                  size="xs"
                  color="light"
                  disabled={filters.page === 1}
                  onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) - 1 })}
                >
                  ←
                </Button>
                <span className="text-xs text-muted px-2 py-1">
                  {filters.page} / {totalPages}
                </span>
                <Button
                  size="xs"
                  color="light"
                  disabled={filters.page === totalPages}
                  onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) + 1 })}
                >
                  →
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-md bg-surface border-l border-border-card h-full overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-card">
              <h3 className="text-sm font-body-bold text-heading">{t("auditLog.logEntry")}</h3>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-body cursor-pointer text-lg">✕</button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <DetailRow label={t("auditLog.detail.date")} value={formatDate(selected.createdAt)} />
              <DetailRow label={t("auditLog.detail.action")} value={t(`auditLog.action.${selected.action}` as any) || selected.action} />
              <DetailRow label={t("auditLog.detail.category")} value={selected.category} />
              <DetailRow label={t("auditLog.detail.level")} value={selected.level} />
              <DetailRow label={t("auditLog.detail.source")} value={selected.source ?? "—"} />
              <DetailRow label={t("auditLog.detail.entityType")} value={selected.entityType} />
              <DetailRow label={t("auditLog.detail.entityId")} value={selected.entityId} search={filters.search} />
              <DetailRow label={t("auditLog.detail.user")} value={selected.userName ?? selected.userId ?? t("auditLog.system")} />
              {selected.userId && <DetailRow label={t("auditLog.detail.userId")} value={selected.userId} />}
              <DetailRow label={t("auditLog.detail.workspaceId")} value={selected.workspaceId ?? "—"} />
              <div>
                <p className="text-xs font-body-semibold text-subtle uppercase mb-1">{t("auditLog.detail.metadata")}</p>
                <MetadataKeyValue metadata={selected.metadata} search={filters.search} />
              </div>
              <DetailRow label={t("auditLog.detail.logId")} value={selected.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, search }: { label: string; value: string; search?: string }) {
  return (
    <div>
      <p className="text-xs font-body-semibold text-subtle uppercase mb-0.5">{label}</p>
      <p className="text-sm text-body break-all">{search ? <HighlightText text={value} search={search} /> : value}</p>
    </div>
  );
}

