import { useContext, useEffect, useId } from "react";
import { UnsavedChangesContext } from "@modules/app/context/unsaved-changes-context";

/** Tells the dashboard this form holds unsaved changes, so leaving it from a menu asks first. */
export default function useUnsavedChanges(dirty: boolean) {
  const { setDirty } = useContext(UnsavedChangesContext);
  const key = useId();

  useEffect(() => {
    setDirty(key, dirty);
  }, [key, dirty, setDirty]);

  useEffect(() => () => setDirty(key, false), [key, setDirty]);
}

/** Runs a navigation only once any unsaved changes have been discarded. */
export function useLeaveGuard() {
  return useContext(UnsavedChangesContext).confirmLeave;
}
