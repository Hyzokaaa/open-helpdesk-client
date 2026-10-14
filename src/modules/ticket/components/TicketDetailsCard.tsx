import Card from "@modules/app/modules/ui/components/Card/Card";
import PropertyRow from "./PropertyRow";
import { formatDuration, formatResponseTime } from "../domain/format-response-time";
import { formatTimeAgo } from "../domain/format-time-ago";
import { slaTargetStatus, type SlaTargetStatus } from "../domain/sla-target-status";
import useTranslation from "@modules/app/i18n/useTranslation";
import type { TicketDetail } from "../services/ticket.service";
import type { SlaPolicy } from "@modules/workspace/services/workspace.service";

interface TicketTimesCardProps {
  ticket: TicketDetail;
  isTerminal: boolean;
  /** The workspace's targets; each time shows its own under it, when the priority has one */
  slaPolicy: SlaPolicy | null;
  /** The plan has no SLA tracking: a line points to it instead */
  slaLocked: boolean;
  formatDate: (date: string) => string;
  t: (key: any) => string;
}

type Priority = keyof SlaPolicy["firstResponse"];

export default function TicketDetailsCard({
  ticket,
  isTerminal,
  slaPolicy,
  slaLocked,
  formatDate,
  t,
}: TicketTimesCardProps) {
  const { lang } = useTranslation();
  const priority = ticket.priority as Priority;
  const frTarget = slaPolicy?.firstResponse[priority] ?? null;
  const resTarget = slaPolicy?.resolution[priority] ?? null;
  const isDiscarded = ticket.status === "discarded";

  // A target that no longer applies (closed without that milestone) shows nothing
  const frStatus = isTerminal && !ticket.firstResponseAt ? null : slaTargetStatus({
    targetHours: frTarget, createdAt: ticket.createdAt, completedAt: ticket.firstResponseAt, breached: ticket.firstResponseBreached,
  });
  const resStatus = isDiscarded ? null : slaTargetStatus({
    targetHours: resTarget, createdAt: ticket.createdAt, completedAt: ticket.resolvedAt, breached: ticket.resolutionBreached,
  });

  /** "target 4h · met", "target 24h · 3h 10m left": the line under a time */
  const slaLine = (hours: number, status: SlaTargetStatus) => {
    const target = t("ticketDetail.slaTargetHours").replace("{hours}", String(hours));
    const [text, color] =
      status.kind === "met" ? [t("ticketDetail.slaMetShort"), "text-green-600"]
      : status.kind === "missed" ? [t("ticketDetail.slaMissedShort"), "text-red-500"]
      : status.kind === "overdue" ? [t("ticketDetail.slaOverdue").replace("{time}", formatDuration(status.ms)), "text-red-500"]
      : [t("ticketDetail.slaLeft").replace("{time}", formatDuration(status.ms)), status.low ? "text-amber-500" : ""];
    return <>{target} · <span className={color}>{text}</span></>;
  };
  const sub = "block text-exs text-subtle font-body";

  return (
    <Card className="p-4">
      <p className="text-xs text-subtle font-body-semibold mb-1">
        {t("ticketDetail.times")}
      </p>
      <div className="divide-y divide-border-card/50">
        {ticket.createdAt && (
          <PropertyRow label={t("ticketDetail.created")}>
            <span className="text-xs text-body font-body-medium">{formatDate(ticket.createdAt)}</span>
          </PropertyRow>
        )}

        <PropertyRow label={t("ticketDetail.firstResponse")}>
          <span className="text-xs text-body font-body-medium">
            {ticket.firstResponseAt && ticket.createdAt
              ? formatResponseTime(ticket.createdAt, ticket.firstResponseAt)
              : isTerminal
                ? "—"
                : t("ticketDetail.awaitingResponse")}
            {frStatus && frTarget !== null && <span className={sub}>{slaLine(frTarget, frStatus)}</span>}
          </span>
        </PropertyRow>

        {ticket.resolvedAt ? (
          <PropertyRow label={t("ticketDetail.resolved")}>
            {/* Who resolved it is with the people, in Properties; here, when and how long it took */}
            <span className="text-xs text-body font-body-medium">
              {formatDate(ticket.resolvedAt)}
              {ticket.createdAt && (
                <span className={sub}>
                  {resStatus && resTarget !== null
                    ? <>{formatResponseTime(ticket.createdAt, ticket.resolvedAt)} · {slaLine(resTarget, resStatus)}</>
                    : t("ticketDetail.resolvedAfter").replace("{time}", formatResponseTime(ticket.createdAt, ticket.resolvedAt))}
                </span>
              )}
            </span>
          </PropertyRow>
        ) : resStatus && resTarget !== null && (
          // Still open: worth a row only when there is a target to keep
          <PropertyRow label={t("ticketDetail.resolution")}>
            <span className="text-xs text-body font-body-medium">
              {t("ticketDetail.resolutionPending")}
              <span className={sub}>{slaLine(resTarget, resStatus)}</span>
            </span>
          </PropertyRow>
        )}

        {ticket.lastActivityAt && (
          <PropertyRow label={t("ticketDetail.lastActivity")}>
            <span className="text-xs text-body font-body-medium">
              {formatDate(ticket.lastActivityAt)}
              <span className={sub}>{formatTimeAgo(ticket.lastActivityAt, lang)}</span>
            </span>
          </PropertyRow>
        )}

        {ticket.originDate && (
          <PropertyRow label={t("ticketDetail.originalDate")}>
            <span className="text-xs text-body font-body-medium">{formatDate(ticket.originDate)}</span>
          </PropertyRow>
        )}
      </div>
      {slaLocked && (
        <p className="text-exs text-subtle mt-2 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span>
            {t("ticketDetail.slaLocked")} ·{" "}
            <a href="/dashboard/settings/billing" className="text-primary hover:underline">{t("planLimit.upgradeToUnlock")}</a>
          </span>
        </p>
      )}
    </Card>
  );
}
