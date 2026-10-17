import { createContext, useContext, useEffect } from "react";

/** Returns true when it took over the close (e.g. to ask about unsaved changes); the sheet then stays open. */
export type SheetCloseGuard = () => boolean;

export const SheetCloseGuardContext = createContext<((guard: SheetCloseGuard | null) => void) | null>(null);

/**
 * Lets the content of a Sheet stop it from closing: the X, a click outside and Escape all ask
 * the guard first. Content that is not inside a Sheet is unaffected.
 */
export function useSheetCloseGuard(guard: SheetCloseGuard): void {
  const register = useContext(SheetCloseGuardContext);
  useEffect(() => {
    if (!register) return;
    register(guard);
    return () => register(null);
  }, [register, guard]);
}
