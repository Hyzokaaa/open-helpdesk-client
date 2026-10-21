import { RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  /** The sidebar: every element inside it with `data-tip` gets its name shown beside it. */
  containerRef: RefObject<HTMLElement | null>;
  enabled: boolean;
}

const DELAY_MS = 300;
const WARM_MS = 400;

/**
 * The names of the folded sidebar's icons, beside them. Shown on hover after a short delay (at
 * once while moving from one icon to the next) and at once on keyboard focus; Escape and scrolling
 * hide it. Hidden from screen readers: each icon keeps its text label, only visually clipped.
 */
export default function SidebarTooltip({ containerRef, enabled }: Props) {
  const [tip, setTip] = useState<{ text: string; shortcut?: string; left: number; top: number } | null>(null);
  const timer = useRef(0);
  const warmUntil = useRef(0);
  const current = useRef<HTMLElement | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) {
      setTip(null);
      return;
    }

    const show = (el: HTMLElement, now: boolean) => {
      if (el.getAttribute("aria-expanded") === "true") return;
      window.clearTimeout(timer.current);
      const go = () => {
        current.current = el;
        const r = el.getBoundingClientRect();
        const c = container.getBoundingClientRect();
        setTip({ text: el.dataset.tip ?? "", shortcut: el.dataset.tipShortcut, left: c.right + 8, top: r.top + r.height / 2 });
      };
      if (now || Date.now() < warmUntil.current) go();
      else timer.current = window.setTimeout(go, DELAY_MS);
    };
    const hide = () => {
      window.clearTimeout(timer.current);
      if (current.current) warmUntil.current = Date.now() + WARM_MS;
      current.current = null;
      setTip(null);
    };
    const target = (e: Event) => (e.target as HTMLElement | null)?.closest?.<HTMLElement>("[data-tip]") ?? null;

    const onOver = (e: PointerEvent) => {
      const el = target(e);
      if (el && el !== current.current) show(el, false);
    };
    const onOut = (e: PointerEvent) => {
      const el = target(e);
      if (el && !el.contains(e.relatedTarget as Node | null)) hide();
    };
    const onFocus = (e: FocusEvent) => {
      const el = target(e);
      if (el && el.matches(":focus-visible")) show(el, true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && current.current) hide();
    };

    container.addEventListener("pointerover", onOver);
    container.addEventListener("pointerout", onOut);
    container.addEventListener("pointerleave", hide);
    container.addEventListener("focusin", onFocus);
    container.addEventListener("focusout", hide);
    container.addEventListener("click", hide);
    container.addEventListener("scroll", hide, true);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer.current);
      container.removeEventListener("pointerover", onOver);
      container.removeEventListener("pointerout", onOut);
      container.removeEventListener("pointerleave", hide);
      container.removeEventListener("focusin", onFocus);
      container.removeEventListener("focusout", hide);
      container.removeEventListener("click", hide);
      container.removeEventListener("scroll", hide, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [enabled, containerRef]);

  if (!tip) return null;
  return createPortal(
    <div
      ref={tipRef}
      aria-hidden="true"
      style={{ left: tip.left, top: tip.top }}
      className="fixed z-[90] -translate-y-1/2 flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-body-medium bg-gray-900 text-white dark:bg-gray-700 dark:border dark:border-gray-600 shadow-lg pointer-events-none whitespace-nowrap"
    >
      <span>{tip.text}</span>
      {tip.shortcut && <span className="text-exs font-mono text-gray-300 border border-gray-600 rounded px-1">{tip.shortcut}</span>}
    </div>,
    document.body,
  );
}
