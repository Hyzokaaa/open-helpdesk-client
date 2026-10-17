import { useEffect, useRef } from "react";

const EVENT = "workspace-membership-changed";

/** Tells every open view that the current user's membership of a workspace changed, so member lists reload. */
export function notifyMembershipChanged(workspaceSlug: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: workspaceSlug }));
}

/** Runs `onChange` whenever the current user's membership of this workspace changes. */
export function useMembershipChanged(workspaceSlug: string | undefined, onChange: () => void) {
  const callback = useRef(onChange);
  callback.current = onChange;

  useEffect(() => {
    if (!workspaceSlug) return;
    const handler = (event: Event) => {
      if ((event as CustomEvent<string>).detail === workspaceSlug) callback.current();
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [workspaceSlug]);
}
