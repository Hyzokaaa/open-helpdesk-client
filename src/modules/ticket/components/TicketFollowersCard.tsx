import Card from "@modules/app/modules/ui/components/Card/Card";
import UserAvatar from "@modules/user/components/UserAvatar";
import MemberLink from "./MemberLink";
import { removeParticipant } from "../services/ticket.service";
import type { TicketParticipant } from "../services/ticket.service";
import { canRemoveFollower } from "../domain/can-remove-follower";

interface TicketFollowersCardProps {
  participants: TicketParticipant[];
  /** ticket.participants.manage, needed to remove anyone other than yourself */
  canManageFollowers: boolean;
  currentUserId: string | undefined;
  workspaceSlug: string | undefined;
  ticketId: string | undefined;
  fetchParticipants: () => void;
  t: (key: any) => string;
  /** For the same hover card and stats link as the assignee and the reporter */
  members?: { userId: string; firstName: string; lastName: string; email: string; role: string; avatarUrl?: string | null }[];
  getPerson?: (id: string) => { avatarUrl?: string | null } | undefined;
  navigate?: (path: string) => void;
}

export default function TicketFollowersCard({
  participants,
  canManageFollowers,
  currentUserId,
  workspaceSlug,
  ticketId,
  fetchParticipants,
  t,
  members = [],
  getPerson,
  navigate = () => {},
}: TicketFollowersCardProps) {
  return (
    <Card className="p-4">
      <p className="text-xs text-subtle font-body-medium mb-2">
        {t("ticketDetail.followers")} ({participants.length})
      </p>
      {participants.length > 0 ? (
        <div className="space-y-1.5">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-2 min-w-0">
                <UserAvatar avatarUrl={getPerson?.(p.userId)?.avatarUrl} firstName={p.firstName} lastName={p.lastName} size="xs" />
                <span className="text-xs min-w-0">
                  <MemberLink
                    userId={p.userId}
                    members={members}
                    getMemberName={(id) => (id === p.userId ? `${p.firstName} ${p.lastName}` : id)}
                    navigate={navigate}
                    workspaceSlug={workspaceSlug}
                    align="left"
                  />
                </span>
              </div>
              {canRemoveFollower(p.userId, currentUserId, canManageFollowers) && (
                <button
                  onClick={async () => {
                    if (!workspaceSlug || !ticketId) return;
                    await removeParticipant(workspaceSlug, ticketId, p.userId);
                    fetchParticipants();
                  }}
                  className="text-exs text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {t("ticketDetail.removeFollower")}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-exs text-muted">{t("ticketDetail.followerHint")}</p>
      )}
    </Card>
  );
}
