import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import UserAvatar from "@modules/user/components/UserAvatar";
import { isTeamRole } from "@modules/workspace/domain/team-role";
import useUser from "@modules/user/hooks/useUser";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";

export type CardMember = { userId: string; firstName: string; lastName: string; email: string; role: string; avatarUrl?: string | null };

interface TriggerProps {
  userId: string;
  members: readonly CardMember[];
  navigate: (path: string) => void;
  workspaceSlug?: string;
  /** Which edge of the trigger the card lines up with. */
  anchor?: "left" | "right";
  /** False for a second trigger of the same person (the avatar next to the name), so the keyboard stops once. */
  focusable?: boolean;
  className?: string;
  /** Added only when the click opens the stats. */
  linkClassName?: string;
  children: ReactNode;
}

/** Opens the member's card on hover or focus and their stats on click. Without a member entry it renders the children as they are. */
export function MemberCardTrigger({ userId, members, navigate, workspaceSlug, anchor = "right", focusable = true, className = "", linkClassName = "", children }: TriggerProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const m = members.find((m) => m.userId === userId);
  const { user } = useUser();
  const { can } = usePermissions(workspaceSlug);
  // Someone else's stats need the report permission; without it the trigger only shows the card
  const canOpenStats = user?.id === userId || can(P.REPORT_VIEW);

  // A customer cannot list members: there is no profile to open
  if (!m) return <>{children}</>;

  const handleEnter = () => {
    if (!ref.current) return;
    // Every trigger of one row (avatar and name) places the card from the row, so it does not move between them
    const rect = (ref.current.closest("[data-card-anchor]") ?? ref.current).getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: anchor === "left" ? rect.left : rect.right });
    setShow(true);
  };

  return (
    <>
      <button
        ref={ref}
        type="button"
        tabIndex={focusable ? undefined : -1}
        onClick={() => workspaceSlug && canOpenStats && navigate(`/dashboard/workspaces/${workspaceSlug}/stats/${userId}`)}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
        onFocus={handleEnter}
        onBlur={() => setShow(false)}
        className={`${canOpenStats ? `cursor-pointer ${linkClassName}` : "cursor-default"} rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${className}`}
      >
        {children}
      </button>
      {show && createPortal(
        <div
          className="fixed z-[9999] bg-surface border border-border-card rounded-lg shadow-lg p-3 min-w-[200px] text-left pointer-events-none flex items-center gap-3"
          style={{ top: pos.top, left: pos.left, transform: anchor === "left" ? undefined : "translateX(-100%)" }}
        >
          <UserAvatar avatarUrl={m.avatarUrl} userId={m.userId} firstName={m.firstName} lastName={m.lastName} team={isTeamRole(m.role)} size="lg" />
          <div className="min-w-0">
            <p className="text-sm font-body-semibold text-heading">{m.firstName} {m.lastName}</p>
            <p className="text-xs text-muted mt-0.5">{m.email}</p>
            {m.role && <p className="text-xs text-subtle mt-1 capitalize">{m.role}</p>}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

interface Props {
  userId: string;
  members: readonly CardMember[];
  getMemberName: (id: string) => string;
  navigate: (path: string) => void;
  workspaceSlug?: string;
  align?: "left" | "right";
  /** Flows with surrounding text instead of taking its own line. */
  inline?: boolean;
}

export default function MemberLink({ userId, members, getMemberName, navigate, workspaceSlug, align = "right", inline }: Props) {
  const alignClass = align === "left" ? "text-left" : "text-right";

  if (!members.some((m) => m.userId === userId)) {
    return (
      <span className={inline ? "text-body font-body-medium" : `${alignClass} min-w-0 block break-words leading-snug text-body font-body-medium`}>
        {getMemberName(userId)}
      </span>
    );
  }

  return (
    <span className={inline ? "" : `${alignClass} min-w-0`}>
      <MemberCardTrigger
        userId={userId}
        members={members}
        navigate={navigate}
        workspaceSlug={workspaceSlug}
        linkClassName="hover:text-primary"
        className={`text-body font-body-medium transition-colors ${
          inline ? "inline underline decoration-dotted underline-offset-2" : `block break-words leading-snug ${alignClass}`
        }`}
      >
        {getMemberName(userId)}
      </MemberCardTrigger>
    </span>
  );
}
