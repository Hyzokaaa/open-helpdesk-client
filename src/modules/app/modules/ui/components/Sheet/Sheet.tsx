import { useEffect } from "react";
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

export default function Sheet({ children, onClose, size = "lg" }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop — only this element closes the sheet */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Content — clicks here don't propagate to backdrop */}
      <div
        className={clsx("relative bg-surface rounded-xl shadow-2xl w-full max-h-[90vh] overflow-auto mx-4 my-4", sizeClasses[size])}
      >
        <button
          onClick={onClose}
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
