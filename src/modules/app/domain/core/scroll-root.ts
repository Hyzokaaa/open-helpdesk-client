/**
 * Brings an element's top into view by scrolling only the dashboard's content area
 * ([data-scroll-root]). Unlike scrollIntoView, it never moves the layout around it, which
 * would shift the navbar out of sight. Does nothing when the top is already visible.
 */
export function scrollToTopOf(el: HTMLElement | null, gap = 16): void {
  const root = el?.closest<HTMLElement>("[data-scroll-root]");
  if (!el || !root) return;
  const offset = el.getBoundingClientRect().top - root.getBoundingClientRect().top;
  if (offset < 0) root.scrollTo({ top: root.scrollTop + offset - gap });
}
