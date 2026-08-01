import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface Props {
  items: ActionMenuItem[];
}

export default function ActionMenu({ items }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.right });
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) return;
      setOpen(false);
    };

    const handleScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        setOpen(false);
        return;
      }
      updatePosition();
    };

    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, updatePosition]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) updatePosition();
    setOpen(!open);
  };

  if (items.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-heading hover:bg-surface-hover transition-colors cursor-pointer"
      >
        ⋯
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 bg-surface border border-border-input rounded-lg shadow-lg py-1 min-w-[140px] flex flex-col"
          style={{ top: pos.top, left: pos.left, transform: "translateX(-100%)" }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
              className={clsx(
                "w-full text-left px-3 py-1.5 text-xs font-body-medium transition-colors cursor-pointer whitespace-nowrap",
                item.danger
                  ? "text-danger hover:bg-danger-hover"
                  : "text-secondary-text hover:bg-surface-hover",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
