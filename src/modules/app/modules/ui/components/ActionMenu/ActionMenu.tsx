import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right });
    }
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
          className="fixed z-50 bg-surface border border-border-input rounded-lg shadow-lg py-1 min-w-[140px]"
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
                "w-full text-left px-3 py-1.5 text-xs font-body-medium transition-colors cursor-pointer",
                item.danger
                  ? "text-danger hover:bg-danger/5"
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
