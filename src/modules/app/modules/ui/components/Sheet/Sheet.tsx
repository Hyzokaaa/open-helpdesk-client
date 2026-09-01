import { useEffect, useRef } from "react";
import clsx from "clsx";

type SheetSize = "sm" | "md" | "lg";

const sizeClasses: Record<SheetSize, string> = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
};

interface Props {
  children: React.ReactNode;
  onClose: () => void;
  size?: SheetSize;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Sheet({ children, onClose, size = "lg" }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    // Focus the first focusable element inside the sheet
    requestAnimationFrame(() => {
      const first = contentRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      if (first) first.focus();
      else contentRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && contentRef.current) {
        const focusable = Array.from(contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      {/* Backdrop — only this element closes the sheet */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Content — clicks here don't propagate to backdrop */}
      <div
        ref={contentRef}
        tabIndex={-1}
        className={clsx("relative bg-surface rounded-xl shadow-2xl w-full max-h-[90vh] overflow-auto mx-4 my-4 outline-none", sizeClasses[size])}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="sticky top-3 float-right mr-3 mt-1 text-subtle hover:text-secondary-text text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors cursor-pointer z-20"
        >
          ✕
        </button>

        <div className="p-6 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
