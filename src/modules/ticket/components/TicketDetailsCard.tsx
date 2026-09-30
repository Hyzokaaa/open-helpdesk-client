import Card from "@modules/app/modules/ui/components/Card/Card";
import PropertyRow from "./PropertyRow";
import MemberLink from "./MemberLink";
import { formatResponseTime } from "../domain/format-response-time";
import type { TicketDetail } from "../services/ticket.service";
import type { WorkspaceMember } from "@modules/workspace/services/workspace.service";

interface TicketTimesCardProps {
  ticket: TicketDetail;
  members: WorkspaceMember[];
  getMemberName: (id: string) => string;
  navigate: (path: string) => void;
  workspaceSlug: string | undefined;
  isTerminal: boolean;
  formatDate: (date: string) => string;
  t: (key: any) => string;
}

export default function TicketDetailsCard({
  ticket,
  members,
  getMemberName,
  navigate,
  workspaceSlug,
  isTerminal,
  formatDate,
  t,
}: TicketTimesCardProps) {
  return (
    <Card className="p-4">
      <p className="text-xs text-subtle font-body-semibold mb-1">
        {t("ticketDetail.times")}
      </p>
      <div className="divide-y divide-border-card/50">
        <PropertyRow label={t("ticketDetail.firstResponse")}>
          <span className="text-xs text-body font-body-medium">
            {ticket.firstResponseAt && ticket.createdAt
              ? formatResponseTime(ticket.createdAt, ticket.firstResponseAt)
              : isTerminal
                ? "—"
                : t("ticketDetail.awaitingResponse")}
          </span>
        </PropertyRow>

        {ticket.resolvedAt && (
          <PropertyRow label={t("ticketDetail.resolved")}>
            {/* No avatar here on purpose: this is an event attribute, not a person field. */}
            <span className="text-xs text-body font-body-medium">
              {formatDate(ticket.resolvedAt)}
              {ticket.resolvedById && (
                <>
                  {", "}
                  <MemberLink
                    userId={ticket.resolvedById}
                    members={members}
                    getMemberName={getMemberName}
                    navigate={navigate}
                    workspaceSlug={workspaceSlug}
                    align="left"
                    inline
                  />
                </>
              )}
            </span>
          </PropertyRow>
        )}

        {ticket.originDate && (
          <PropertyRow label={t("ticketDetail.originalDate")}>
            <span className="text-xs text-body font-body-medium">{formatDate(ticket.originDate)}</span>
          </PropertyRow>
        )}
      </div>
    </Card>
  );
}
