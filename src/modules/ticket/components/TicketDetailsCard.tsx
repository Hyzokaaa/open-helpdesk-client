import Card from "@modules/app/modules/ui/components/Card/Card";
import UserAvatar from "@modules/user/components/UserAvatar";
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
        {([
          [t("ticketDetail.reportedBy"), ticket.reporterId],
          ...(ticket.registeredById ? [[t("ticketDetail.registeredBy"), ticket.registeredById] as const] : []),
        ] as const).map(([label, personId]) => {
          const person = members.find((m) => m.userId === personId);
          return (
            <div key={label} className="flex justify-between items-center gap-2">
              <span className="text-muted shrink-0">{label}</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <UserAvatar avatarUrl={person?.avatarUrl} firstName={person?.firstName} lastName={person?.lastName} size="sm" />
                <MemberLink userId={personId} members={members} getMemberName={getMemberName} navigate={navigate} workspaceSlug={workspaceSlug} />
              </div>
            </div>
          );
        })}
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
