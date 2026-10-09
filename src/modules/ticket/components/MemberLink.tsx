import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import UserAvatar from "@modules/user/components/UserAvatar";
import useUser from "@modules/user/hooks/useUser";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";

interface Props {
  userId: string;
  members: { userId: string; firstName: string; lastName: string; email: string; role: string; avatarUrl?: string | null }[];
  getMemberName: (id: string) => string;
  navigate: (path: string) => void;
  workspaceSlug?: string;
  align?: "left" | "right";
  /** Flows with surrounding text instead of taking its own line. */
  inline?: boolean;
}

export default function MemberLink({ userId, members, getMemberName, navigate, workspaceSlug, align = "right", inline }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const m = members.find((m) => m.userId === userId);
  const alignClass = align === "left" ? "text-left" : "text-right";
  const { user } = useUser();
  const { can } = usePermissions(workspaceSlug);
  // Someone else's stats need the report permission; without it the name only shows the card
  const canOpenStats = user?.id === userId || can(P.REPORT_VIEW);

  const handleEnter = () => {
    if (!ref.current || !m) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.right,
    });
    setShow(true);
  };

  // Without a member entry (a customer cannot list members) there is no profile to open: plain text
  if (!m) {
    return (
      <span className={inline ? "text-body font-body-medium" : `${alignClass} min-w-0 block break-words leading-snug text-body font-body-medium`}>
        {getMemberName(userId)}
      </span>
    );
  }

  return (
    <span className={inline ? "" : `${alignClass} min-w-0`}>
      <button
        ref={ref}
        type="button"
        onClick={() => workspaceSlug && canOpenStats && navigate(`/dashboard/workspaces/${workspaceSlug}/stats/${userId}`)}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
        onFocus={handleEnter}
        onBlur={() => setShow(false)}
        className={`text-body font-body-medium ${canOpenStats ? "cursor-pointer hover:text-primary" : "cursor-default"} transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
          inline ? "inline underline decoration-dotted underline-offset-2" : `block break-words leading-snug ${alignClass}`
        }`}
      >
        {getMemberName(userId)}
      </button>
      {show && m && createPortal(
        <div
          className="fixed z-[9999] bg-surface border border-border-card rounded-lg shadow-lg p-3 min-w-[200px] text-left pointer-events-none flex items-center gap-3"
          style={{ top: pos.top, left: pos.left, transform: "translateX(-100%)" }}
        >
          <UserAvatar avatarUrl={m.avatarUrl} firstName={m.firstName} lastName={m.lastName} size="lg" />
          <div className="min-w-0">
            <p className="text-sm font-body-semibold text-heading">{m.firstName} {m.lastName}</p>
            <p className="text-xs text-muted mt-0.5">{m.email}</p>
            {m.role && <p className="text-xs text-subtle mt-1 capitalize">{m.role}</p>}
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}
