import { useCallback, useEffect, useState } from "react";
import useMediaQuery from "./useMediaQuery";
import { isSidebarCollapsed, isSidebarShortcut, readCollapsedChoice, sidebarCollapsedKey } from "@modules/app/domain/core/sidebar-collapse";

const read = (key: string | null): boolean | null => {
  if (!key) return null;
  try {
    return readCollapsedChoice(window.localStorage.getItem(key));
  } catch {
    return null;
  }
};

/** Whether the app sidebar is folded to a rail, and a way to change it, remembered per user and browser. */
export default function useSidebarCollapsed(userId: string | undefined) {
  const lg = useMediaQuery("(min-width: 1024px)");
  const xl = useMediaQuery("(min-width: 1280px)");
  const key = userId ? sidebarCollapsedKey(userId) : null;
  const [choice, setChoice] = useState<boolean | null>(() => read(key));

  useEffect(() => setChoice(read(key)), [key]);

  const collapsed = isSidebarCollapsed({ lg, xl }, choice);

  const toggle = useCallback(() => {
    if (!lg) return;
    const next = !collapsed;
    setChoice(next);
    try {
      if (key) window.localStorage.setItem(key, next ? "1" : "0");
    } catch { /* private mode: the choice lasts this visit */ }
  }, [lg, collapsed, key]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inEditableOrDialog = !!target?.closest?.("input, textarea, select, [contenteditable=''], [contenteditable='true'], [role='dialog'], [role='alertdialog']");
      if (!isSidebarShortcut({
        key: e.key,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        repeat: e.repeat,
        altGraph: e.getModifierState?.("AltGraph") ?? false,
        inEditableOrDialog,
      })) return;
      e.preventDefault();
      toggle();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toggle]);

  return { collapsed, toggle, canCollapse: lg };
}
