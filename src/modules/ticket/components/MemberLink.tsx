import { useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  userId: string;
  members: { userId: string; firstName: string; lastName: string; email: string; role: string }[];
  getMemberName: (id: string) => string;
  navigate: (path: string) => void;
  workspaceSlug?: string;
}

export default function MemberLink({ userId, members, getMemberName, navigate, workspaceSlug }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const m = members.find((m) => m.userId === userId);

  const handleEnter = () => {
    if (!ref.current || !m) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.right,
    });
    setShow(true);
  };

  return (
    <span className="text-right min-w-0">
      <button
        ref={ref}
        onClick={() => workspaceSlug && navigate(`/dashboard/workspaces/${workspaceSlug}/stats/${userId}`)}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
        className="text-body font-body-medium truncate block cursor-pointer hover:text-primary transition-colors text-right"
      >
        {getMemberName(userId)}
      </button>
      {show && m && createPortal(
        <div
          className="fixed z-[9999] bg-surface border border-border-card rounded-lg shadow-lg p-3 min-w-[200px] text-left pointer-events-none"
          style={{ top: pos.top, left: pos.left, transform: "translateX(-100%)" }}
        >
          <p className="text-sm font-body-semibold text-heading">{m.firstName} {m.lastName}</p>
          <p className="text-xs text-muted mt-0.5">{m.email}</p>
          {m.role && <p className="text-xs text-subtle mt-1 capitalize">{m.role}</p>}
        </div>,
        document.body,
      )}
    </span>
  );
}
