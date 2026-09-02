import Card from "@modules/app/modules/ui/components/Card/Card";
import type { TicketDetail } from "../services/ticket.service";
import type { SlaPolicy } from "@modules/workspace/services/workspace.service";

interface Props {
  ticket: TicketDetail;
  slaPolicy: SlaPolicy;
  t: (key: any) => string;
  isTerminal: boolean;
}

export default function SlaStatusCard({ ticket, slaPolicy, t, isTerminal }: Props) {
  const priority = ticket.priority as "critical" | "high" | "medium" | "low";
  const frTarget = slaPolicy.firstResponse[priority];
  const resTarget = slaPolicy.resolution[priority];

  if (frTarget === null && resTarget === null) return null;

  const formatRemaining = (ms: number) => {
    if (ms <= 0) return null;
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${t("ticketDetail.slaRemaining")}`;
    return `${minutes}m ${t("ticketDetail.slaRemaining")}`;
  };

  const getSlaStatus = (
    targetHours: number | null,
    breached: boolean,
    completedAt: string | null,
  ): { label: string; color: string } | null => {
    if (targetHours === null) return null;

    if (breached) {
      return { label: t("ticketDetail.slaBreached"), color: "text-red-500" };
    }

    if (completedAt) {
      return { label: t("ticketDetail.slaMet"), color: "text-green-500" };
    }

    if (isTerminal) {
      return { label: "—", color: "text-muted" };
    }

    if (ticket.createdAt) {
      const deadline = new Date(ticket.createdAt).getTime() + targetHours * 3600000;
      const remaining = deadline - Date.now();
      const formatted = formatRemaining(remaining);
      if (formatted) {
        return { label: formatted, color: remaining < targetHours * 3600000 * 0.25 ? "text-amber-500" : "text-muted" };
      }
    }

    return null;
  };

  const frStatus = getSlaStatus(frTarget, ticket.firstResponseBreached, ticket.firstResponseAt);
  const resStatus = getSlaStatus(resTarget, ticket.resolutionBreached, ticket.resolvedAt);

  if (!frStatus && !resStatus) return null;

  return (
    <Card className="p-4">
      <p className="text-xs text-subtle font-body-medium mb-2">
        {t("ticketDetail.slaTarget")}
      </p>
      <div className="space-y-2 text-xs">
        {frStatus && frTarget !== null && (
          <div className="flex items-center justify-between">
            <span className="text-muted">{t("ticketDetail.slaFirstResponse")} ({frTarget}h)</span>
            <span className={`font-body-medium flex items-center gap-1.5 ${frStatus.color}`}>
              {ticket.firstResponseBreached && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
              {frStatus.label}
            </span>
          </div>
        )}
        {resStatus && resTarget !== null && (
          <div className="flex items-center justify-between">
            <span className="text-muted">{t("ticketDetail.slaResolution")} ({resTarget}h)</span>
            <span className={`font-body-medium flex items-center gap-1.5 ${resStatus.color}`}>
              {ticket.resolutionBreached && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
              {resStatus.label}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
