import { listEmails } from "@modules/workspace/domain/invitation-email";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import FilterPopover, { FilterChip, buildInitialState, getActiveFilterCount, getFilterChips, type FilterSection, type FilterState } from "@modules/app/modules/ui/components/FilterPopover/FilterPopover";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import { listMembers, WorkspaceMember } from "@modules/workspace/services/workspace.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import {
  AuditLogItem,
  AuditLogFilters,
  listAuditLog,
} from "../services/audit-log.service";
import { formatDetailValue, formatInlineValue, isStructuredValue } from "../domain/audit-metadata";
import { commentPreview, describeChanges, fieldLabel, formatChange, isCommentAction, type ReferenceNames } from "../domain/audit-summary";
import { actionOptions, entityTypeLabel } from "../domain/audit-actions";
import { listDepartments } from "@modules/department/services/department.service";
import { listProjects, listCategories } from "@modules/project/services/project.service";
import { listOrganizations } from "@modules/organization/services/organization.service";
import { listTags } from "@modules/tag/services/tag.service";

/** Names by id for the references old entries stored as bare ids; a list the user cannot read stays out. */
async function loadReferenceNames(slug: string): Promise<ReferenceNames> {
  const silent = { silent: true };
  const toMap = (rows: { id: string; name: string }[]) => new Map(rows.map((r) => [r.id, r.name]));
  const [categories, departments, organizations, projects, tags] = await Promise.allSettled([
    listCategories(slug, undefined, silent),
    listDepartments(slug, silent),
    listOrganizations(slug, silent),
    listProjects(slug, silent),
    listTags(slug, silent),
  ]);
  const names: ReferenceNames = {};
  if (categories.status === "fulfilled") names.categoryId = toMap(categories.value);
  if (departments.status === "fulfilled") names.departmentId = toMap(departments.value);
  if (organizations.status === "fulfilled") names.organizationId = toMap(organizations.value);
  if (projects.status === "fulfilled") names.projectId = toMap(projects.value);
  if (tags.status === "fulfilled") names.tagIds = toMap(tags.value);
  return names;
}

const ENTITY_TYPES = [
  "ticket",
  "workspace",
  "workspace-member",
  "user",
  "invitation",
  "transfer-request",
  "mailbox",
  "email",
  "email-sender",
  "email-rule",
  "organization",
  "project",
  "ticket-category",
  "department",
  "tag",
  "canned-response",
  "custom-field",
  "webhook",
  "api-key",
  "kb-category",
  "kb-article",
  "attachment",
  "csat",
  "route",
];

const CATEGORIES = ["ticket", "workspace", "user", "security", "email", "config", "knowledge-base", "system", "billing"];

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
  "workspace-exported": "blue",
  "workspace-export-created": "blue",
  "workspace-export-link-downloaded": "blue",
  "workspace-import-completed": "green",
  "workspace-import-failed": "red",
  "workspace-analytics-updated": "blue",
  // Members
  "member-added": "green",
  "member-removed": "red",
  "member-role-changed": "yellow",
  "permission-denied": "red",
  "workspace-custom-domain-verification-failed": "red",
  "email-rule-created": "green",
  "email-rule-updated": "blue",
  "email-rule-deleted": "red",
  "email-rule-reordered": "blue",
  "organization-member-added": "green",
  "organization-member-removed": "red",
  "member-organization-changed": "yellow",
  "email-processing-failed": "red",
  "api-session-exchanged": "yellow",
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
  const formatDate = useFormatDate();

  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState<'permission' | 'upgrade' | false>(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<AuditLogItem | null>(null);
  const [referenceNames, setReferenceNames] = useState<ReferenceNames>({});
  const canViewLog = can(P.AUDIT_LOG_VIEW);

  const filterSections: FilterSection[] = useMemo(() => [
    { key: "actions", label: t("auditLog.col.action"), type: "multi", options: actionOptions("workspace", t as (k: string) => string) },
    { key: "entityTypes", label: t("auditLog.col.entity"), type: "multi", options: ENTITY_TYPES.map(e => ({ value: e, label: entityTypeLabel(e, t as (k: string) => string) })) },
    { key: "categories", label: t("auditLog.col.category"), type: "multi", options: CATEGORIES.map(c => ({ value: c, label: t(`auditLog.category.${c}` as any) || c })) },
    { key: "userIds", label: t("auditLog.col.user"), type: "multi", options: members.map(m => ({ value: m.userId, label: `${m.firstName} ${m.lastName}` })) },
  ], [t, members]);

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
      entityTypes: getSelected("entityTypes"),
      categories: getSelected("categories"),
      userIds: getSelected("userIds"),
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
    if (!workspaceSlug || !canViewLog) return;
    let cancelled = false;
    loadReferenceNames(workspaceSlug).then((names) => { if (!cancelled) setReferenceNames(names); });
    return () => { cancelled = true; };
  }, [workspaceSlug, canViewLog]);

  useEffect(() => {
    fetchLog();
  }, [workspaceSlug, filters]);

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.userId === userId);
    return m ? `${m.firstName} ${m.lastName}` : userId.slice(0, 8) + "...";
  };

  /** A member by the member list; someone no longer in the workspace by the name the server sent. */
  const actorName = (userId: string, userName?: string | null) => {
    if (members.some((m) => m.userId === userId)) return getMemberName(userId);
    return userName ? `${userName} (${t("auditLog.formerMember")})` : getMemberName(userId);
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
              clearTimeout((window as any).__auditSearchTimer);
              (window as any).__auditSearchTimer = setTimeout(() => {
                setFilters(f => ({ ...f, search: val || undefined, page: 1 }));
              }, 500);
            }}
            placeholder={t("auditLog.search")}
            className="w-full pl-8 pr-3 py-1.5 rounded-input border-input bg-surface text-sm text-body placeholder:text-muted focus:outline-none focus:border-primary-400 transition-colors"
          />
        </div>
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
                      <div className="flex flex-wrap items-center gap-1">
                        <StatusBadge
                          label={t(`auditLog.action.${item.action}` as any)}
                          color={ACTION_COLORS[item.action] ?? "gray"}
                          size="xs"
                        />
                        <SourceBadge source={item.source} t={t} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted">{entityTypeLabel(item.entityType, t as (k: string) => string)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-body">
                        {item.userId ? actorName(item.userId, item.userName) : t("auditLog.system")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <MetadataSummary metadata={item.metadata} action={item.action} t={t} search={filters.search} names={referenceNames} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted">
                        {formatDate(item.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const hasMetadataMatch = filters.search && item.metadata && JSON.stringify(item.metadata).toLowerCase().includes(filters.search.toLowerCase());
                        return (
                          <button
                            onClick={() => setSelected(item)}
                            className={`text-xs cursor-pointer ${hasMetadataMatch ? "bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-body-semibold" : "text-primary hover:underline"}`}
                          >
                            {t("auditLog.view")}{hasMetadataMatch ? " ●" : ""}
                          </button>
                        );
                      })()}
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
              <DetailRow label={t("auditLog.detail.entityType")} value={entityTypeLabel(selected.entityType, t as (k: string) => string)} />
              <DetailRow label={t("auditLog.detail.entityId")} value={selected.entityId} search={filters.search} />
              <DetailRow label={t("auditLog.detail.user")} value={selected.userId ? actorName(selected.userId, selected.userName) : t("auditLog.system")} />
              {selected.userId && <DetailRow label={t("auditLog.detail.userId")} value={selected.userId} />}
              <div>
                <p className="text-xs font-body-semibold text-subtle uppercase mb-1">{t("auditLog.detail.metadata")}</p>
                <MetadataKeyValue metadata={selected.metadata} action={selected.action} t={t} search={filters.search} names={referenceNames} />
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

export function HighlightText({ text, search }: { text: string; search?: string }): ReactNode {
  if (!search || !text) return text;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-yellow-200/70 text-inherit rounded-sm px-0.5">{part}</mark> : part,
  );
}

export function MetadataSummary({ metadata, action, t, search, names = {} }: { metadata: Record<string, unknown> | null; action: string; t: (k: any) => string; search?: string; names?: ReferenceNames }) {
  if (!metadata) return <span className="text-xs text-muted">—</span>;

  const parts: string[] = [];

  // Primary identifier: name, title, address, email — whatever identifies the entity
  const label = (metadata.name ?? metadata.title ?? metadata.address ?? metadata.ticketName ?? metadata.email ?? metadata.domain ?? metadata.subject) as string | undefined;
  if (label) parts.push(label);

  // Before/after diffs (updates): translated field names, names instead of ids
  const changes = describeChanges(metadata, names, t);
  if (changes.length > 0) parts.push(changes.map(formatChange).join(", "));

  // Comment preview: plain text, also for older entries that stored the HTML
  if (isCommentAction(action)) {
    const preview = commentPreview(metadata.content);
    if (preview) parts.push(`"${preview}"`);
  }

  // Assignment info
  if (metadata.assignee) parts.push(`→ ${metadata.assignee}`);

  // Transfer info
  if (metadata.from && metadata.to) parts.push(`${metadata.from} → ${metadata.to}`);

  // Target (member actions)
  if (metadata.target && !metadata.from) parts.push(String(metadata.target));

  // Role info, translated
  if (metadata.role) {
    const roleKey = `enum.role.${metadata.role}`;
    const role = t(roleKey);
    parts.push(`(${role && role !== roleKey ? role : String(metadata.role)})`);
  }

  // Single settings stored without a before/after pair
  if (metadata.palette) parts.push(`${fieldLabel("palette", t)}: ${formatInlineValue(metadata.palette)}`);
  if (typeof metadata.systemMailboxEnabled === "boolean") {
    parts.push(`${fieldLabel("systemMailboxEnabled", t)}: ${t(metadata.systemMailboxEnabled ? "auditLog.value.yes" : "auditLog.value.no")}`);
  }

  // Batch actions: who they were for, falling back to the count when the entry has no list
  const batchEmails = Array.isArray(metadata.invitations)
    ? (metadata.invitations as { email?: unknown }[]).map((i) => i?.email).filter((e): e is string => typeof e === "string")
    : [];
  if (batchEmails.length > 0) parts.push(listEmails(batchEmails, t));
  else if (metadata.count) parts.push(`×${metadata.count}`);

  // Error info
  if (metadata.error) parts.push(`Error: ${formatInlineValue(metadata.error).slice(0, 80)}`);
  if (metadata.reason) parts.push(reasonLabel(metadata.reason, t).slice(0, 80));

  // Refused route, webhook host
  if (metadata.route) parts.push(`${metadata.method ?? ""} ${metadata.route}`.trim());
  if (metadata.host) parts.push(String(metadata.host));

  // Provider (OAuth)
  if (metadata.provider) parts.push(String(metadata.provider));

  if (parts.length === 0) return <span className="text-xs text-muted">—</span>;
  const joined = parts.join(" — ");
  return <span className="text-xs text-muted">{search ? <HighlightText text={joined} search={search} /> : joined}</span>;
}

const DIFF_KEYS = new Set(["before", "after", "beforeLabels", "afterLabels", "client", "imported"]);

/** A failure reason stored as a code, translated when there is a translation. */
function reasonLabel(reason: unknown, t: (k: any) => string): string {
  const raw = formatInlineValue(reason);
  const key = `auditLog.reason.${raw}`;
  const translated = t(key);
  return translated && translated !== key ? translated : raw;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return isStructuredValue(value) && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

/**
 * Who sent the request (access events) and where an imported row came from, as labelled rows.
 * The proxy's IP is what the X-Forwarded-For header said: informational, a direct caller can fake it.
 */
function contextRows(metadata: Record<string, unknown>, t: (k: any) => string): [string, unknown][] {
  const rows: [string, unknown][] = [];
  const client = asObject(metadata.client);
  if (client) {
    if (client.forwardedFor) rows.push([t("auditLog.detail.forwardedFor"), client.forwardedFor]);
    if (client.ip) rows.push([t("auditLog.detail.ip"), client.ip]);
    if (client.userAgent) rows.push([t("auditLog.detail.userAgent"), client.userAgent]);
  }
  const imported = asObject(metadata.imported);
  if (imported) {
    if (imported.at) rows.push([t("auditLog.detail.importedAt"), imported.at]);
    if (imported.fromWorkspace) rows.push([t("auditLog.detail.importedFrom"), imported.fromWorkspace]);
    if (imported.originalSource) rows.push([t("auditLog.detail.importedSource"), imported.originalSource]);
  }
  return rows;
}

/** Marks entries that did not come from someone using this installation's interface. */
export function SourceBadge({ source, t }: { source: string | null; t: (k: any) => string }) {
  if (source === "import") return <StatusBadge label={t("auditLog.source.import")} color="yellow" size="xs" />;
  if (source === "api") return <StatusBadge label={t("auditLog.source.api")} color="blue" size="xs" />;
  return null;
}

export function MetadataKeyValue({ metadata, action, t, search, names = {} }: { metadata: Record<string, unknown> | null; action: string; t: (k: any) => string; search?: string; names?: ReferenceNames }) {
  if (!metadata) return <span className="text-xs text-muted">—</span>;

  const entries: [string, unknown][] = Object.entries(metadata)
    .filter(([key]) => !DIFF_KEYS.has(key))
    // Comments as plain text, also for older entries that stored the HTML; failure reasons translated
    .map(([key, val]) => {
      if (key === "content" && isCommentAction(action)) return [key, commentPreview(val, 300)];
      if (key === "reason") return [key, reasonLabel(val, t)];
      return [key, val];
    });
  entries.push(...contextRows(metadata, t));

  // Merge before/after into diff rows, by field name and with names instead of ids
  for (const change of describeChanges(metadata, names, t)) {
    entries.push([change.label || "before → after", `${change.from} → ${change.to}`]);
  }

  if (entries.length === 0) return <span className="text-xs text-muted">—</span>;

  return (
    <div className="bg-surface-hover rounded p-3 space-y-2">
      {entries.map(([key, val]) => {
        // Older entries may hold objects or arrays: shown as indented JSON, never "[object Object]"
        const text = formatDetailValue(val);
        const content = search ? <HighlightText text={text} search={search} /> : text;
        return (
          <div key={key} className="flex gap-2 items-baseline">
            <span className="text-xs font-body-semibold text-subtle min-w-[80px] shrink-0">{key}</span>
            {isStructuredValue(val) ? (
              <pre className="text-xs text-body whitespace-pre-wrap break-all font-mono m-0 min-w-0">{content}</pre>
            ) : (
              <span className="text-xs text-body break-all">{content}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
