import { createContext } from "react";

export interface UnsavedChangesContextProps {
  /** A form says whether it holds changes not saved yet, under a key of its own. */
  setDirty: (key: string, dirty: boolean) => void;
  hasUnsaved: () => boolean;
  /** Runs `leave` at once when nothing is unsaved; otherwise only after the person agrees to discard. */
  confirmLeave: (leave: () => void) => void;
}

// Outside the dashboard nothing tracks changes, so leaving never asks
export const UnsavedChangesContext = createContext<UnsavedChangesContextProps>({
  setDirty: () => {},
  hasUnsaved: () => false,
  confirmLeave: (leave) => leave(),
});
