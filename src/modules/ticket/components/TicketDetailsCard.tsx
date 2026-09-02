import Card from "@modules/app/modules/ui/components/Card/Card";
import MemberLink from "./MemberLink";
import { formatResponseTime } from "../domain/format-response-time";
import type { TicketDetail } from "../services/ticket.service";
import type { WorkspaceMember } from "@modules/workspace/services/workspace.service";

interface TicketDetailsCardProps {
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
}: TicketDetailsCardProps) {
  return (
    <Card className="p-4">
      <p className="text-xs text-subtle font-body-medium mb-2">
        {t("ticketDetail.details")}
      </p>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between gap-2">
          <span className="text-muted shrink-0">{t("ticketDetail.reportedBy")}</span>
          <MemberLink userId={ticket.reporterId} members={members} getMemberName={getMemberName} navigate={navigate} workspaceSlug={workspaceSlug} />
        </div>
        {ticket.registeredById && (
          <div className="flex justify-between gap-2">
            <span className="text-muted shrink-0">{t("ticketDetail.registeredBy")}</span>
            <MemberLink userId={ticket.registeredById} members={members} getMemberName={getMemberName} navigate={navigate} workspaceSlug={workspaceSlug} />
          </div>
        )}
        {ticket.assigneeId && (
          <div className="flex justify-between">
            <span className="text-muted">{t("ticketDetail.assignee")}</span>
            <span className="text-body font-body-medium">
              {getMemberName(ticket.assigneeId)}
            </span>
          </div>
        )}
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-muted shrink-0">{t("ticketDetail.firstResponse")}</span>
          <span className="text-body font-body-medium text-right">
            {ticket.firstResponseAt && ticket.createdAt
              ? formatResponseTime(ticket.createdAt, ticket.firstResponseAt)
              : isTerminal
                ? "—"
                : t("ticketDetail.awaitingResponse")}
          </span>
        </div>
        {ticket.resolvedAt && (
          <div className="flex justify-between">
            <span className="text-muted">{t("ticketDetail.resolved")}</span>
            <span className="text-body font-body-medium">
              {formatDate(ticket.resolvedAt)}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
