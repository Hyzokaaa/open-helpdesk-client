/** Where the choice is kept: per browser (it depends on the screen) and per user (laptops get shared). */
export const sidebarCollapsedKey = (userId: string) => `sidebar_collapsed:${userId}`;

/** A stored choice: "1" folded, "0" unfolded, anything else none yet. */
export function readCollapsedChoice(raw: string | null): boolean | null {
  if (raw === "1") return true;
  if (raw === "0") return false;
  return null;
}

/**
 * Whether the app sidebar shows as a rail of icons. Below `lg` it is the phone drawer and always
 * shows in full. Once someone has chosen, their choice holds on any wide screen; until then a
 * laptop-sized screen (lg up to xl) starts folded and a larger one unfolded, so whoever has room
 * notices no change.
 */
export function isSidebarCollapsed(screen: { lg: boolean; xl: boolean }, choice: boolean | null): boolean {
  if (!screen.lg) return false;
  return choice ?? !screen.xl;
}

/**
 * Whether a key press is the "[" shortcut that folds or unfolds the sidebar. Not while typing,
 * nor inside a dialog, nor held down. On a Spanish keyboard "[" takes AltGr, which Windows sends
 * as Ctrl+Alt, so Ctrl only rules it out without AltGr.
 */
export function isSidebarShortcut(e: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  repeat: boolean;
  altGraph: boolean;
  inEditableOrDialog: boolean;
}): boolean {
  if (e.key !== "[" || e.metaKey || e.repeat || e.inEditableOrDialog) return false;
  if (e.ctrlKey && !e.altGraph) return false;
  return true;
}
