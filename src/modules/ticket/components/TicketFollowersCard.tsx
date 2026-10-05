import Card from "@modules/app/modules/ui/components/Card/Card";
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
}

export default function TicketFollowersCard({
  participants,
  canManageFollowers,
  currentUserId,
  workspaceSlug,
  ticketId,
  fetchParticipants,
  t,
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
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-exs font-body-bold text-primary">
                    {p.firstName[0]}{p.lastName[0]}
                  </span>
                </div>
                <span className="text-xs text-body">{p.firstName} {p.lastName}</span>
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
