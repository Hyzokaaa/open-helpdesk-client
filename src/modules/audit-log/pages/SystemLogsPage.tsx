import { useEffect, useState } from "react";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Select from "@modules/app/modules/ui/components/Select/Select";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import { inputClass } from "@modules/app/modules/ui/shared/domain/input-class";
import {
  AuditLogItem,
  AuditLogFilters,
  listAllAuditLog,
} from "../services/audit-log.service";
import { MetadataSummary } from "./WorkspaceAuditLogPage";

const ACTIONS = [
  "ticket-created",
  "ticket-updated",
  "ticket-status-changed",
  "ticket-assigned",
  "ticket-picked-up",
  "ticket-transferred",
  "ticket-deleted",
  "comment-created",
  "workspace-created",
  "workspace-updated",
  "workspace-deleted",
  "member-added",
  "member-removed",
  "member-role-changed",
  "user-created",
  "user-activated",
  "user-deactivated",
  "user-admin-toggled",
  "user-signed-up",
  "user-logged-in",
  "user-forgot-password",
  "user-reset-password",
  "user-email-verified",
  "user-oauth-login",
  "mailbox-created",
  "mailbox-updated",
  "mailbox-deleted",
  "mailbox-paused",
  "mailbox-resumed",
  "email-received",
  "email-sent",
  "email-send-failed",
  "email-sender-configured",
  "email-sender-deleted",
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-44">
          <Select
            options={["all", ...CATEGORIES]}
            label={(c) => c === "all" ? t("auditLog.allCategories") : c}
            value={(c) => c === (filters.category ?? "all")}
            onChange={(c) => setFilters({ ...filters, category: c === "all" ? undefined : c, page: 1 })}
            placeholder={t("auditLog.allCategories")}
          />
        </div>
        <div className="w-44">
          <Select
            options={["all", ...LEVELS]}
            label={(l) => l === "all" ? t("auditLog.allLevels") : l}
            value={(l) => l === (filters.level ?? "all")}
            onChange={(l) => setFilters({ ...filters, level: l === "all" ? undefined : l, page: 1 })}
            placeholder={t("auditLog.allLevels")}
          />
        </div>
        <div className="w-44">
          <Select
            options={["all", ...ACTIONS]}
            label={(a) => a === "all" ? t("auditLog.allActions") : t(`auditLog.action.${a}` as any) ?? a}
            value={(a) => a === (filters.action ?? "all")}
            onChange={(a) => setFilters({ ...filters, action: a === "all" ? undefined : a, page: 1 })}
            placeholder={t("auditLog.allActions")}
          />
        </div>
        <div className="w-44">
          <Select
            options={["all", ...SOURCES]}
            label={(s) => s === "all" ? t("auditLog.allSources") : s}
            value={(s) => s === (filters.source ?? "all")}
            onChange={(s) => setFilters({ ...filters, source: s === "all" ? undefined : s, page: 1 })}
            placeholder={t("auditLog.allSources")}
          />
        </div>
        <input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined, page: 1 })}
          className={inputClass({ size: "sm", full: false, extra: "!w-36" })}
          placeholder="From"
        />
        <input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined, page: 1 })}
          className={inputClass({ size: "sm", full: false, extra: "!w-36" })}
          placeholder="To"
        />
      </div>

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
                        {item.userName ?? (item.userId ? item.userId.slice(0, 8) + "..." : "System")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <MetadataSummary metadata={item.metadata} action={item.action} t={t} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(item)}
                        className="text-xs text-primary hover:underline cursor-pointer"
                      >
                        View
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
              <h3 className="text-sm font-body-bold text-heading">Log Entry</h3>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-body cursor-pointer text-lg">✕</button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <DetailRow label="Date" value={formatDate(selected.createdAt)} />
              <DetailRow label="Action" value={t(`auditLog.action.${selected.action}` as any) || selected.action} />
              <DetailRow label="Category" value={selected.category} />
              <DetailRow label="Level" value={selected.level} />
              <DetailRow label="Source" value={selected.source ?? "—"} />
              <DetailRow label="Entity Type" value={selected.entityType} />
              <DetailRow label="Entity ID" value={selected.entityId} />
              <DetailRow label="User" value={selected.userName ?? selected.userId ?? "System"} />
              {selected.userId && <DetailRow label="User ID" value={selected.userId} />}
              <DetailRow label="Workspace ID" value={selected.workspaceId ?? "—"} />
              <div>
                <p className="text-xs font-body-semibold text-subtle uppercase mb-1">Metadata</p>
                {selected.metadata ? (
                  <pre className="text-xs text-body bg-surface-hover rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                ) : (
                  <span className="text-xs text-muted">—</span>
                )}
              </div>
              <DetailRow label="Log ID" value={selected.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-body-semibold text-subtle uppercase mb-0.5">{label}</p>
      <p className="text-sm text-body break-all">{value}</p>
    </div>
  );
}

