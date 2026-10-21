import { ReactNode, RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  id: string;
  title: string;
  /** What opened it: the panel sits beside it, and the focus goes back to it on Escape. */
  triggerRef: RefObject<HTMLElement | null>;
  /** The sidebar, to place the panel just past its edge and to carry on tabbing through it. */
  containerRef: RefObject<HTMLElement | null>;
  /** Opened from the keyboard: the focus moves to the first entry. */
  focusFirst: boolean;
  /** Below the trigger, as wide as it, instead of beside the sidebar (the unfolded workspace switcher). */
  below?: boolean;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE = "a[href], button:not([disabled])";

/**
 * A panel of links opened from the folded sidebar: a disclosure, not a menu, since its entries are
 * plain navigation. Arrow keys move between them, Escape closes it back to its trigger, and since
 * it lives outside the sidebar in the page, Tab past its ends carries on through the sidebar.
 */
export default function SidebarFlyout({ id, title, triggerRef, containerRef, focusFirst, below, onClose, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number; width?: number } | null>(null);

  useLayoutEffect(() => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    const container = containerRef.current?.getBoundingClientRect();
    const panel = panelRef.current;
    if (!trigger || !container || !panel) return;
    if (below) {
      setPosition({ left: trigger.left + 12, top: trigger.bottom + 4, width: trigger.width - 24 });
    } else {
      const top = Math.min(Math.max(trigger.top - 8, 8), window.innerHeight - panel.offsetHeight - 8);
      setPosition({ left: container.right + 8, top });
    }
  }, [below, triggerRef, containerRef]);

  useEffect(() => {
    if (focusFirst && position) panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [focusFirst, !!position]);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      const node = e.target as Node;
      if (panelRef.current?.contains(node) || triggerRef.current?.contains(node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onClose();
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, triggerRef]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const items = [...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Tab") {
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        onClose();
        triggerRef.current?.focus();
      } else if (!e.shiftKey && i === items.length - 1) {
        e.preventDefault();
        const all = [...(containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter((x) => x.offsetParent !== null);
        const next = all[all.indexOf(triggerRef.current as HTMLElement) + 1];
        onClose();
        next?.focus();
      }
    }
  };

  return createPortal(
    <div
      id={id}
      ref={panelRef}
      onKeyDown={onKeyDown}
      style={{ left: position?.left ?? -9999, top: position?.top ?? 0, width: position?.width ?? 248, visibility: position ? "visible" : "hidden" }}
      className="fixed z-[80] p-1.5 bg-surface border border-border-input rounded-[10px] shadow-lg max-h-[calc(100dvh-16px)] overflow-y-auto"
    >
      <h2 id={`${id}-title`} className="px-2 pt-1.5 pb-1 text-exs uppercase tracking-[.06em] font-body-semibold text-muted">{title}</h2>
      <div role="group" aria-labelledby={`${id}-title`} className="flex flex-col gap-0.5">{children}</div>
    </div>,
    document.body,
  );
}
