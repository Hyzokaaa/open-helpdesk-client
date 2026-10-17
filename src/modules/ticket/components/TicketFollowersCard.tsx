import { useState } from "react";
import { toast } from "react-toastify";
import Card from "@modules/app/modules/ui/components/Card/Card";
import UserAvatar from "@modules/user/components/UserAvatar";
import type { WorkspaceMember } from "@modules/workspace/services/workspace.service";
import MemberLink from "./MemberLink";
import TicketMemberPickerModal from "./TicketMemberPickerModal";
import NotMemberHint from "@modules/workspace/components/NotMemberHint";
import { addParticipant, removeParticipant } from "../services/ticket.service";
import type { TicketParticipant } from "../services/ticket.service";
import { canRemoveFollower } from "../domain/can-remove-follower";

interface TicketFollowersCardProps {
  participants: TicketParticipant[];
  /** ticket.participants.manage, needed to add or remove anyone other than yourself */
  canManageFollowers: boolean;
  currentUserId: string | undefined;
  workspaceSlug: string | undefined;
  ticketId: string | undefined;
  /** Already told about the ticket, so not offered as followers */
  reporterId?: string;
  assigneeId?: string | null;
  fetchParticipants: () => void;
  t: (key: any) => string;
  /** For the same hover card and stats link as the assignee and the reporter */
  members?: WorkspaceMember[];
  getPerson?: (id: string) => { avatarUrl?: string | null } | undefined;
  navigate?: (path: string) => void;
}

export default function TicketFollowersCard({
  participants,
  canManageFollowers,
  currentUserId,
  workspaceSlug,
  ticketId,
  reporterId,
  assigneeId,
  fetchParticipants,
  t,
  members = [],
  getPerson,
  navigate = () => {},
}: TicketFollowersCardProps) {
  const [removing, setRemoving] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  // Only the team is offered: following lets someone read the ticket
  const candidates = members.filter((m) =>
    m.role !== "user"
    && m.userId !== reporterId
    && m.userId !== assigneeId
    && !participants.some((p) => p.userId === m.userId),
  );

  const remove = async (p: TicketParticipant) => {
    if (!workspaceSlug || !ticketId) return;
    setRemoving(p.userId);
    try {
      await removeParticipant(workspaceSlug, ticketId, p.userId);
      toast.success(p.userId === currentUserId
        ? t("ticketDetail.youUnfollowed")
        : t("ticketDetail.followerRemoved").replace("{name}", `${p.firstName} ${p.lastName}`.trim()));
      fetchParticipants();
    } catch {
      toast.error(t("ticketDetail.followerRemoveError"));
    } finally {
      setRemoving(null);
    }
  };

  const add = async (userId: string | null) => {
    if (!workspaceSlug || !ticketId || !userId) return;
    const member = members.find((m) => m.userId === userId);
    try {
      await addParticipant(workspaceSlug, ticketId, userId);
      toast.success(t("ticketDetail.followerAdded").replace("{name}", member ? `${member.firstName} ${member.lastName}`.trim() : ""));
      fetchParticipants();
      setPicking(false);
    } catch {
      toast.error(t("ticketDetail.followerAddError"));
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-subtle font-body-medium">
          {t("ticketDetail.followers")} ({participants.length})
        </p>
        {canManageFollowers && candidates.length > 0 && (
          <button type="button" onClick={() => setPicking(true)} className="text-exs text-primary hover:underline cursor-pointer">
            + {t("ticketDetail.addFollower")}
          </button>
        )}
      </div>
      {participants.length > 0 ? (
        <div className="space-y-1.5">
          {participants.map((p) => (
            <div key={p.id} className={`flex items-center justify-between gap-2 transition-opacity ${removing === p.userId ? "opacity-50" : ""}`}>
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
                  type="button"
                  onClick={() => remove(p)}
                  disabled={removing !== null}
                  aria-label={t("ticketDetail.removeFollowerOf").replace("{name}", `${p.firstName} ${p.lastName}`.trim())}
                  className="shrink-0 text-exs text-muted hover:text-danger disabled:cursor-wait cursor-pointer"
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
      {/* With nobody left to add there is no picker to explain it in, so a system admin off the team is told here */}
      {canManageFollowers && candidates.length === 0 && <NotMemberHint variant="follow" className="mt-2" />}
      {picking && (
        <TicketMemberPickerModal
          mode="follow"
          assignableMembers={candidates}
          currentUserId={currentUserId ?? ""}
          onSubmit={add}
          onClose={() => setPicking(false)}
          t={t}
        />
      )}
    </Card>
  );
}
