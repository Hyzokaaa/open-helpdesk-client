import { useEffect, useState } from "react";
import { Link } from "react-router";
import useTranslation from "@modules/app/i18n/useTranslation";
import { isPlanLimitError } from "@modules/billing/domain/plan-limit-error";
import { WorkspaceMember } from "@modules/workspace/services/workspace.service";
import { AuditLogItem, listAuditLog } from "../services/audit-log.service";

const COLLAPSED_COUNT = 5;

interface Props {
  workspaceSlug: string;
  ticketId: string;
  members: WorkspaceMember[];
  refreshKey?: number;
}

export default function TicketActivityFeed({ workspaceSlug, ticketId, members, refreshKey }: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    listAuditLog(workspaceSlug, {
      entityType: "ticket",
      entityId: ticketId,
      sortOrder: "ASC",
      limit: 100,
    }, { silent: true })
      .then((res) => { setItems(res.items); setLocked(false); })
      .catch((err) => { if (isPlanLimitError(err)) setLocked(true); })
      .finally(() => setLoading(false));
  }, [workspaceSlug, ticketId, refreshKey]);

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.userId === userId);
    return m ? `${m.firstName} ${m.lastName}` : userId.slice(0, 8) + "...";
  };

  if (loading) return null;
  if (locked) {
    return (
      <div className="flex items-center gap-3 py-3">
        <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <div>
          <p className="text-xs text-muted">{t("auditLog.feed.locked")}</p>
          <Link to="/dashboard/settings/billing" className="text-xs text-primary hover:underline">
            {t("planLimit.upgradeToUnlock")}
          </Link>
        </div>
      </div>
    );
  }
  if (items.length === 0) return null;

  const hasMore = items.length > COLLAPSED_COUNT;
  const visible = expanded ? items : items.slice(-COLLAPSED_COUNT);

  return (
    <div>
      <p className="text-sm font-body-semibold text-body mb-3">
        {t("auditLog.activity")} ({items.length})
      </p>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline mb-2 cursor-pointer"
        >
          {expanded
            ? t("auditLog.feed.showLess")
            : t("auditLog.feed.showAll").replace("{count}", String(items.length))}
        </button>
      )}
      <div className="relative pl-4 border-l-2 border-border-card space-y-3">
        {visible.map((item) => (
          <div key={item.id} className="relative">
            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-border-card border-2 border-surface" />
            <div>
              <p className="text-xs text-body">
                <span className="font-body-semibold">{getMemberName(item.userId)}</span>
                {" "}
                <span className="text-muted">{describeAction(item, t as any, getMemberName)}</span>
              </p>
              <p className="text-exs text-muted mt-0.5">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function describeAction(
  item: AuditLogItem,
  t: (k: string) => string,
  getMemberName: (id: string) => string,
): string {
  const meta = item.metadata ?? {};
  const before = meta.before as Record<string, unknown> | undefined;
  const after = meta.after as Record<string, unknown> | undefined;

  switch (item.action) {
    case "ticket-created":
      return t("auditLog.feed.created");

    case "ticket-updated": {
      if (!before || !after) return t("auditLog.feed.updated");
      const changes = Object.keys(after)
        .filter((k) => String(before[k]) !== String(after[k]))
        .map((k) => `${k}: ${before[k]} → ${after[k]}`);
      if (changes.length === 0) return t("auditLog.feed.updated");
      return `${t("auditLog.feed.updated")} (${changes.join(", ")})`;
    }

    case "ticket-status-changed":
      if (before && after) {
        return `${t("auditLog.feed.statusChanged")} ${before.status} → ${after.status}`;
      }
      return t("auditLog.feed.statusChanged");

    case "ticket-assigned": {
      const newAssignee = after?.assignee;
      if (newAssignee) {
        return `${t("auditLog.feed.assigned")} ${newAssignee}`;
      }
      return t("auditLog.feed.unassigned");
    }

    case "ticket-deleted":
      return t("auditLog.feed.deleted");

    case "comment-created": {
      const content = meta.content as string | undefined;
      if (content) {
        const preview = content.length > 60 ? content.slice(0, 60) + "..." : content;
        return `${t("auditLog.feed.commented")}: "${preview}"`;
      }
      return t("auditLog.feed.commented");
    }

    default:
      return item.action;
  }
}
