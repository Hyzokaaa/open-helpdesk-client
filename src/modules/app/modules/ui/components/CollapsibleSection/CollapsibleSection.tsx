import { useRef, useState, useEffect } from "react";
import clsx from "clsx";

interface Props {
  title: string;
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  className?: string;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  open: controlledOpen,
  onToggle,
  className,
  children,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(isOpen ? undefined : 0);

  useEffect(() => {
    if (!contentRef.current) return;
    if (isOpen) {
      setHeight(contentRef.current.scrollHeight);
      const timeout = setTimeout(() => setHeight(undefined), 200);
      return () => clearTimeout(timeout);
    } else {
      setHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [isOpen]);

  const toggle = () => {
    const next = !isOpen;
    if (controlledOpen === undefined) setInternalOpen(next);
    onToggle?.(next);
  };

  return (
    <div
      className={clsx(
        "rounded-card border-card w-full transition-all duration-200",
        className,
      )}
    >
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-3.5 cursor-pointer select-none"
      >
        <span className="text-sm font-body-semibold text-heading">{title}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={clsx(
            "w-4 h-4 text-muted transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        ref={contentRef}
        style={{ height: height !== undefined ? `${height}px` : undefined }}
        className="overflow-hidden transition-[height] duration-200 ease-in-out"
      >
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
