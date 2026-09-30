import { useCallback, useEffect, useRef } from "react";

/**
 * Tracks which overlays are currently open, innermost last.
 *
 * Escape and body scroll locking are global concerns: without a shared stack every
 * overlay listens on `document` and a nested one closes its parent too. Any overlay
 * must register a layer, even if it does not handle Escape itself, so the ones
 * underneath can tell they are no longer on top.
 */
const stack: symbol[] = [];

export function isTopLayer(id: symbol): boolean {
  return stack.length > 0 && stack[stack.length - 1] === id;
}

export interface ModalLayer {
  /** True only while this overlay is the innermost one open. */
  isTop: () => boolean;
}

export function useModalLayer(): ModalLayer {
  const idRef = useRef<symbol | null>(null);
  if (idRef.current === null) idRef.current = Symbol("modal-layer");

  useEffect(() => {
    const id = idRef.current as symbol;
    const previousOverflow = stack.length === 0 ? document.body.style.overflow : null;
    stack.push(id);
    document.body.style.overflow = "hidden";

    return () => {
      const index = stack.indexOf(id);
      if (index !== -1) stack.splice(index, 1);
      // Only the outermost overlay restores scrolling; nested ones must not.
      if (stack.length === 0) document.body.style.overflow = previousOverflow ?? "";
    };
  }, []);

  const isTop = useCallback(() => isTopLayer(idRef.current as symbol), []);

  return { isTop };
}
