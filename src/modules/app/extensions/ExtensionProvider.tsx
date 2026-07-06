import type { ReactNode } from "react";
import { ExtensionContext, defaultExtensions, type Extensions } from "./extension-context";

interface Props {
  extensions?: Partial<Extensions>;
  children: ReactNode;
}

export default function ExtensionProvider({ extensions, children }: Props) {
  const merged = extensions ? { ...defaultExtensions, ...extensions } : defaultExtensions;

  return (
    <ExtensionContext.Provider value={merged}>
      {children}
    </ExtensionContext.Provider>
  );
}
