import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import useTranslation from "@modules/app/i18n/useTranslation";
import { UnsavedChangesContext } from "./unsaved-changes-context";

/**
 * Keeps track of the forms with unsaved changes, so moving to another page from a menu asks
 * first, and closing or reloading the tab gets the browser's own warning. The app uses
 * `BrowserRouter`, which cannot block navigation (no `useBlocker`), so the menus ask through
 * `confirmLeave` themselves; the browser's Back button is not covered.
 */
export default function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const dirty = useRef(new Set<string>());
  const [pending, setPending] = useState<(() => void) | null>(null);

  const setDirty = useCallback((key: string, isDirty: boolean) => {
    if (isDirty) dirty.current.add(key);
    else dirty.current.delete(key);
  }, []);

  const hasUnsaved = useCallback(() => dirty.current.size > 0, []);

  const confirmLeave = useCallback((leave: () => void) => {
    if (dirty.current.size === 0) leave();
    else setPending(() => leave);
  }, []);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current.size === 0) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const value = useMemo(() => ({ setDirty, hasUnsaved, confirmLeave }), [setDirty, hasUnsaved, confirmLeave]);

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      {pending && (
        <ConfirmModal
          title={t("discard.title")}
          message={t("discard.message")}
          confirmLabel={t("discard.confirm")}
          cancelLabel={t("ticketDetail.cancel")}
          danger
          onConfirm={() => {
            const leave = pending;
            // The forms being left are unmounted next, which clears their own entries
            dirty.current.clear();
            setPending(null);
            leave();
          }}
          onCancel={() => setPending(null)}
        />
      )}
    </UnsavedChangesContext.Provider>
  );
}
