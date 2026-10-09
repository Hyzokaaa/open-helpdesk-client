import { ReactNode } from "react";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import { AuditLogItem } from "../services/audit-log.service";
import { codeLabel, fieldLabel, isTechnicalField, type ReferenceNames } from "../domain/audit-summary";
import { HighlightText, MetadataKeyValue, MetadataSummary } from "../pages/WorkspaceAuditLogPage";

type BadgeColor = "primary" | "yellow" | "green" | "red" | "gray" | "blue";

interface Props {
  entry: AuditLogItem;
  actor: string;
  actionColor: BadgeColor;
  entityTypeLabel: string;
  onClose: () => void;
  search?: string;
  names?: ReferenceNames;
  /** Further ids for the folded section, such as the workspace in the system log */
  technicalRows?: [string, string][];
}

/**
 * One log entry, wide enough to read: what happened and to whom first, then the fields in plain
 * words, and the ids someone tracing a problem needs folded at the bottom.
 */
export default function LogEntryPanel({ entry, actor, actionColor, entityTypeLabel, onClose, search, names, technicalRows = [] }: Props) {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const actionKey = `auditLog.action.${entry.action}`;
  const actionLabel = t(actionKey as any) !== actionKey ? t(actionKey as any) : entry.action;

  const metadata = entry.metadata ?? {};
  const technicalMetadata = Object.entries(metadata).filter(([key, value]) => isTechnicalField(key, value));
  const technical: [string, string][] = [
    [t("auditLog.detail.entityId"), entry.entityId],
    ...(entry.userId ? [[t("auditLog.detail.userId"), entry.userId] as [string, string]] : []),
    ...technicalRows,
    ...technicalMetadata.map(([key, value]) => [fieldLabel(key, t as any), String(value)] as [string, string]),
    [t("auditLog.detail.logId"), entry.id],
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-2xl bg-surface border-l border-border-card h-full overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border-card">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge label={actionLabel} color={actionColor} size="xs" />
              <span className="text-xs text-muted">{formatDate(entry.createdAt)} · {actor}</span>
            </div>
            {/* The same one-line summary as the list, large enough to read at a glance */}
            <div className="text-sm text-body [&_span]:!text-sm [&_span]:!text-body">
              <MetadataSummary metadata={entry.metadata} action={entry.action} t={t} search={search} names={names} />
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-body cursor-pointer text-lg shrink-0">✕</button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <Field label={t("auditLog.detail.user")} value={actor} />
            <Field label={t("auditLog.detail.entityType")} value={entityTypeLabel} />
            <Field label={t("auditLog.detail.category")} value={codeLabel("auditLog.category", entry.category, t)} />
            <Field label={t("auditLog.detail.level")} value={codeLabel("auditLog.level", entry.level, t)} />
            <Field label={t("auditLog.detail.source")} value={codeLabel("auditLog.source", entry.source, t)} />
          </div>

          <div>
            <p className="text-xs font-body-semibold text-subtle uppercase mb-2">{t("auditLog.details")}</p>
            <MetadataKeyValue metadata={entry.metadata} action={entry.action} t={t} search={search} names={names} hideTechnical />
          </div>

          <details className="group">
            <summary className="text-xs font-body-semibold text-subtle uppercase cursor-pointer select-none">
              {t("auditLog.technicalDetails")}
            </summary>
            <div className="mt-3 bg-surface-hover rounded p-3 space-y-2">
              {technical.map(([label, value]) => (
                <div key={label} className="flex gap-3 items-baseline">
                  <span className="text-xs font-body-semibold text-subtle min-w-[110px] shrink-0">{label}</span>
                  <span className="text-xs text-body font-mono break-all">{search ? <HighlightText text={value} search={search} /> : value}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-body-semibold text-subtle uppercase mb-0.5">{label}</p>
      <p className="text-sm text-body break-words">{value}</p>
    </div>
  );
}
