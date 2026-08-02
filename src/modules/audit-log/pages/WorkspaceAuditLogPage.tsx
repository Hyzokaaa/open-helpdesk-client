import { useEffect, useState } from "react";
import { useParams } from "react-router";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Select from "@modules/app/modules/ui/components/Select/Select";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import { listMembers, WorkspaceMember } from "@modules/workspace/services/workspace.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";
import {
  AuditLogItem,
  AuditLogFilters,
  listAuditLog,
} from "../services/audit-log.service";

const ACTIONS = [
  // Ticket
  "ticket-created", "ticket-updated", "ticket-status-changed", "ticket-assigned",
  "ticket-picked-up", "ticket-transferred", "ticket-deleted",
  // Transfer
  "transfer-request-created", "transfer-request-accepted", "transfer-request-rejected",
  "transfer-request-cancelled", "transfer-request-expired",
  // Comment
  "comment-created",
  // Workspace
  "workspace-created", "workspace-updated", "workspace-deleted",
  "workspace-palette-updated", "workspace-sla-updated", "workspace-import-started",
  // Members
  "member-added", "member-removed", "member-role-changed",
  // Invitations
  "invitation-created", "invitation-batch-created", "invitation-cancelled",
  // Mailbox
  "mailbox-created", "mailbox-updated", "mailbox-deleted",
  "mailbox-paused", "mailbox-resumed", "mailbox-poll-triggered", "mailbox-import-started",
  // Email
  "imap-poll-completed", "imap-poll-failed", "email-received",
  "email-sender-configured", "email-sender-deleted",
  // Config
  "custom-field-created", "custom-field-updated", "custom-field-deleted", "custom-field-reordered",
  "tag-created", "tag-deleted",
  "canned-response-created", "canned-response-updated", "canned-response-deleted",
  "webhook-created", "webhook-updated", "webhook-deleted",
  "api-key-created", "api-key-deleted",
  // KB
  "kb-category-created", "kb-category-updated", "kb-category-deleted",
  "kb-article-created", "kb-article-updated", "kb-article-deleted",
  // SLA
  "sla-first-response-breached", "sla-resolution-breached",
  // Portal
  "portal-ticket-created",
];

const ENTITY_TYPES = [
  "ticket", "workspace", "workspace-member", "mailbox", "custom-field",
  "tag", "canned-response", "webhook", "api-key", "kb-category", "kb-article",
  "email", "email-sender", "invitation", "transfer-request",
];

const CATEGORIES = ["ticket", "workspace", "user", "email", "config", "knowledge-base", "system", "billing"];

const ACTION_COLORS: Record<string, "primary" | "yellow" | "green" | "red" | "gray" | "blue"> = {
  // Ticket
  "ticket-created": "green",
  "ticket-updated": "blue",
  "ticket-status-changed": "yellow",
  "ticket-assigned": "blue",
  "ticket-picked-up": "green",
  "ticket-transferred": "yellow",
  "ticket-deleted": "red",
  // Transfer
  "transfer-request-created": "green",
  "transfer-request-accepted": "green",
  "transfer-request-rejected": "red",
  "transfer-request-cancelled": "red",
  "transfer-request-expired": "red",
  // Comment
  "comment-created": "primary",
  // Workspace
  "workspace-created": "green",
  "workspace-updated": "blue",
  "workspace-deleted": "red",
  "workspace-palette-updated": "blue",
  "workspace-sla-updated": "blue",
  "workspace-import-started": "green",
  // Members
  "member-added": "green",
  "member-removed": "red",
  "member-role-changed": "yellow",
  // Invitations
  "invitation-created": "green",
  "invitation-batch-created": "green",
  "invitation-cancelled": "red",
  // Mailbox
  "mailbox-created": "green",
  "mailbox-updated": "blue",
  "mailbox-deleted": "red",
  "mailbox-paused": "yellow",
  "mailbox-resumed": "green",
  "mailbox-poll-triggered": "blue",
  "mailbox-import-started": "green",
  // Email
  "imap-poll-completed": "green",
  "imap-poll-failed": "red",
  "email-received": "primary",
  "email-sender-configured": "blue",
  "email-sender-deleted": "red",
  // Config
  "custom-field-created": "green",
  "custom-field-updated": "blue",
  "custom-field-deleted": "red",
  "custom-field-reordered": "blue",
  "tag-created": "green",
  "tag-deleted": "red",
  "canned-response-created": "green",
  "canned-response-updated": "blue",
  "canned-response-deleted": "red",
  "webhook-created": "green",
  "webhook-updated": "blue",
  "webhook-deleted": "red",
  "api-key-created": "green",
  "api-key-deleted": "red",
  // KB
  "kb-category-created": "green",
  "kb-category-updated": "blue",
  "kb-category-deleted": "red",
  "kb-article-created": "green",
  "kb-article-updated": "blue",
  "kb-article-deleted": "red",
  // SLA
  "sla-first-response-breached": "yellow",
  "sla-resolution-breached": "yellow",
  // Portal
  "portal-ticket-created": "primary",
};

export default function WorkspaceAuditLogPage() {
  const { workspaceSlug } = useParams();
  const { can } = usePermissions(workspaceSlug);
  const { t } = useTranslation();
  const { PlanGate } = useExtensions();

  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState<'permission' | 'upgrade' | false>(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, limit: 20 });
  const [selected, setSelected] = useState<AuditLogItem | null>(null);

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
        {denied === 'upgrade' ? (
          <PlanGate message={t("auditLog.upgradeRequired")} />
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted">{t("auditLog.noPermission")}</p>
          </div>
        )}
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
            options={["all", ...CATEGORIES]}
            label={(c) => c === "all" ? t("auditLog.allCategories") : t(`auditLog.category.${c}` as any)}
            value={(c) => c === (filters.category ?? "all")}
            onChange={(c) => setFilters({ ...filters, category: c === "all" ? undefined : c, page: 1 })}
            placeholder={t("auditLog.allCategories")}
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
                  <th className="px-4 py-3" />
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
                      <span className="text-sm text-body">
                        {item.userId ? getMemberName(item.userId) : "System"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <MetadataSummary metadata={item.metadata} action={item.action} t={t} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
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
              <DetailRow label="Date" value={new Date(selected.createdAt).toLocaleString()} />
              <DetailRow label="Action" value={t(`auditLog.action.${selected.action}` as any) || selected.action} />
              <DetailRow label="Category" value={selected.category} />
              <DetailRow label="Level" value={selected.level} />
              <DetailRow label="Source" value={selected.source ?? "—"} />
              <DetailRow label="Entity Type" value={selected.entityType} />
              <DetailRow label="Entity ID" value={selected.entityId} />
              <DetailRow label="User" value={selected.userId ? getMemberName(selected.userId) : "System"} />
              {selected.userId && <DetailRow label="User ID" value={selected.userId} />}
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

export function MetadataSummary({ metadata, action, t }: { metadata: Record<string, unknown> | null; action: string; t: (k: any) => string }) {
  if (!metadata) return <span className="text-xs text-muted">—</span>;

  const parts: string[] = [];

  // Primary identifier: name, title, address, email — whatever identifies the entity
  const label = (metadata.name ?? metadata.title ?? metadata.address ?? metadata.ticketName ?? metadata.email) as string | undefined;
  if (label) parts.push(label);

  // Before/after diffs (updates)
  const before = metadata.before as Record<string, unknown> | undefined;
  const after = metadata.after as Record<string, unknown> | undefined;
  if (before && after) {
    const changes = Object.keys(after)
      .filter((key) => String(before[key]) !== String(after[key]))
      .map((key) => `${key}: ${before[key] ?? "—"} → ${after[key] ?? "—"}`);
    if (changes.length > 0) parts.push(changes.join(", "));
  }

  // Comment preview
  if (action === "comment-created" && metadata.content) {
    const clean = String(metadata.content).replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1");
    parts.push(`"${clean.length > 50 ? clean.slice(0, 50) + "..." : clean}"`);
  }

  // Assignment info
  if (metadata.assignee) parts.push(`→ ${metadata.assignee}`);

  // Transfer info
  if (metadata.from && metadata.to) parts.push(`${metadata.from} → ${metadata.to}`);

  // Target (member actions)
  if (metadata.target && !metadata.from) parts.push(String(metadata.target));

  // Role info
  if (metadata.role) parts.push(`(${metadata.role})`);

  // Count (batch actions)
  if (metadata.count) parts.push(`×${metadata.count}`);

  // Error info
  if (metadata.error) parts.push(`Error: ${String(metadata.error).slice(0, 80)}`);

  // Provider (OAuth)
  if (metadata.provider) parts.push(String(metadata.provider));

  if (parts.length === 0) return <span className="text-xs text-muted">—</span>;
  return <span className="text-xs text-muted">{parts.join(" — ")}</span>;
}
