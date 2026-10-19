import { useEffect, useId, useRef } from "react";
import Button from "../Button/Button";
import { useModalLayer } from "../../shared/domain/modal-stack";

interface Props {
  title: string;
  message: string;
  /** Richer content than `message`, such as a list of consequences; shown below it. */
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Asks before an action. Announced as an alert dialog with its title and text; the keyboard stays
 * inside it, the safe choice (cancel) has the focus first, and closing it gives the focus back to
 * whatever opened it.
 */
export default function ConfirmModal({
  title,
  message,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  const layer = useModalLayer();
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => opener?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!layer.isTop()) return;
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel, layer]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="text-base font-body-bold text-heading mb-1">
          {title}
        </h3>
        <div id={messageId} className="text-sm text-muted mb-6">
          {message && <p>{message}</p>}
          {children}
        </div>
        <div className="flex justify-end gap-2">
          <Button ref={cancelRef} size="sm" color="light" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            color={danger ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
