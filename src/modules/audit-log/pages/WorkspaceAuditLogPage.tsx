import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Select from "@modules/app/modules/ui/components/Select/Select";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import { listMembers, WorkspaceMember } from "@modules/workspace/services/workspace.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  AuditLogItem,
  AuditLogFilters,
  listAuditLog,
} from "../services/audit-log.service";

const ACTIONS = [
  "ticket-created",
  "ticket-updated",
  "ticket-status-changed",
  "ticket-assigned",
  "ticket-deleted",
  "comment-created",
  "workspace-created",
  "workspace-updated",
  "workspace-deleted",
  "member-added",
  "member-removed",
  "member-role-changed",
];

const ENTITY_TYPES = ["ticket", "workspace", "workspace-member"];

const ACTION_COLORS: Record<string, "primary" | "yellow" | "green" | "red" | "gray" | "blue"> = {
  "ticket-created": "green",
  "ticket-updated": "blue",
  "ticket-status-changed": "yellow",
  "ticket-assigned": "blue",
  "ticket-deleted": "red",
  "comment-created": "primary",
  "workspace-created": "green",
  "workspace-updated": "blue",
  "workspace-deleted": "red",
  "member-added": "green",
  "member-removed": "red",
  "member-role-changed": "yellow",
};

export default function WorkspaceAuditLogPage() {
  const { workspaceSlug } = useParams();
  const { can } = usePermissions(workspaceSlug);
  const { t } = useTranslation();

  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState<'permission' | 'upgrade' | false>(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, limit: 20 });

  const fetchLog = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listAuditLog(workspaceSlug, filters, { silent: true })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setDenied(false);
      })
      .catch((err) => {
        if (err?.status === 403) {
          const isUpgrade = err.message?.includes('Upgrade');
          setDenied(isUpgrade ? 'upgrade' : 'permission');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (workspaceSlug) listMembers(workspaceSlug).then(setMembers);
  }, [workspaceSlug]);

  useEffect(() => {
    fetchLog();
  }, [workspaceSlug, filters]);

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.userId === userId);
    return m ? `${m.firstName} ${m.lastName}` : userId.slice(0, 8) + "...";
  };

  const totalPages = Math.ceil(total / (filters.limit ?? 20));

  if (!can(P.AUDIT_LOG_VIEW) || denied) {
    return (
      <div className="w-full">
        <h2 className="text-lg font-body-bold text-heading mb-4">{t("auditLog.title")}</h2>
        <div className="text-center py-12">
          <p className="text-sm text-muted">
            {denied === 'upgrade' ? t("auditLog.upgradeRequired") : t("auditLog.noPermission")}
          </p>
          {denied === 'upgrade' && (
            <Link
              to="/dashboard/settings/billing"
              className="inline-block mt-3 text-sm text-primary hover:underline"
            >
              {t("auditLog.goToBilling")}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-lg font-body-bold text-heading mb-4">{t("auditLog.title")}</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-44">
          <Select
            options={["all", ...ACTIONS]}
            label={(a) => a === "all" ? t("auditLog.allActions") : t(`auditLog.action.${a}` as any)}
            value={(a) => a === (filters.action ?? "all")}
            onChange={(a) => setFilters({ ...filters, action: a === "all" ? undefined : a, page: 1 })}
            placeholder={t("auditLog.allActions")}
          />
        </div>
        <div className="w-44">
          <Select
            options={["all", ...ENTITY_TYPES]}
            label={(e) => e === "all" ? t("auditLog.allEntities") : t(`auditLog.entity.${e}` as any)}
            value={(e) => e === (filters.entityType ?? "all")}
            onChange={(e) => setFilters({ ...filters, entityType: e === "all" ? undefined : e, page: 1 })}
            placeholder={t("auditLog.allEntities")}
          />
        </div>
        <div className="w-44">
          <Select
            options={["all", ...members.map((m) => m.userId)]}
            label={(id) => id === "all" ? t("auditLog.allUsers") : getMemberName(id)}
            value={(id) => id === (filters.userId ?? "all")}
            onChange={(id) => setFilters({ ...filters, userId: id === "all" ? undefined : id, page: 1 })}
            placeholder={t("auditLog.allUsers")}
          />
        </div>
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
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("auditLog.col.action")}</th>
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("auditLog.col.entity")}</th>
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("auditLog.col.user")}</th>
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("auditLog.col.details")}</th>
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("auditLog.col.date")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border-row">
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={t(`auditLog.action.${item.action}` as any)}
                        color={ACTION_COLORS[item.action] ?? "gray"}
                        size="xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted">{item.entityType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-body">{getMemberName(item.userId)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <MetadataSummary metadata={item.metadata} action={item.action} t={t} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
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
    </div>
  );
}

function MetadataSummary({ metadata, action, t }: { metadata: Record<string, unknown> | null; action: string; t: (k: any) => string }) {
  if (!metadata) return <span className="text-xs text-muted">—</span>;

  const ticketName = metadata.ticketName as string | undefined;
  const before = metadata.before as Record<string, unknown> | undefined;
  const after = metadata.after as Record<string, unknown> | undefined;

  if (before && after) {
    const changes = Object.keys(after)
      .filter((key) => String(before[key]) !== String(after[key]))
      .map((key) => `${key}: ${before[key] ?? "—"} → ${after[key] ?? "—"}`);
    if (changes.length === 0) return <span className="text-xs text-muted">{ticketName ?? "—"}</span>;
    const prefix = ticketName ? `${ticketName} — ` : "";
    return <span className="text-xs text-muted">{prefix}{changes.join(", ")}</span>;
  }

  if (action === "comment-created") {
    const content = metadata.content as string | undefined;
    const preview = content ? (content.length > 50 ? content.slice(0, 50) + "..." : content) : "";
    const prefix = ticketName ? `${ticketName} — ` : "";
    return <span className="text-xs text-muted">{prefix}"{preview}"</span>;
  }

  if (metadata.name) {
    return <span className="text-xs text-muted">{String(metadata.name)}</span>;
  }

  if (ticketName) {
    return <span className="text-xs text-muted">{ticketName}</span>;
  }

  if (metadata.target) {
    return <span className="text-xs text-muted">{String(metadata.target)}</span>;
  }

  return <span className="text-xs text-muted">—</span>;
}
