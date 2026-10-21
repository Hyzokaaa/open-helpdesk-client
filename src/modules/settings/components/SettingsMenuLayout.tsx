import { ReactNode, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Card from "@modules/app/modules/ui/components/Card/Card";
import { useLeaveGuard } from "@modules/app/hooks/useUnsavedChanges";
import { MenuSection, resolveMenuView } from "../domain/settings-menu";
import SettingsMenuNav, { MenuGroup, SectionHint } from "./SettingsMenuNav";
import SettingsMenuSearch, { RelatedLink } from "./SettingsMenuSearch";

interface Props<Id extends string> {
  title: string;
  subtitle?: string;
  /** The sections the person may see, in menu order. */
  sections: MenuSection<Id>[];
  groups: MenuGroup[];
  sectionTitle: (id: Id) => string;
  /** The section asked for: from the URL, or chosen in place inside a panel. */
  requested: string | undefined;
  /** The bare settings address, each section living under it; without it the sections switch in place. */
  basePath?: string;
  /** Inside a panel, with no URL of its own: a section chosen, or none for the list. */
  onChooseInPlace?: (id: Id | undefined) => void;
  /** Menu and section side by side; otherwise (a phone, a panel) the list and a section take turns. */
  wide: boolean;
  renderSection: (id: Id) => ReactNode;
  /** Beside the section's title, such as whether the portal is open. */
  sectionBadge?: (id: Id) => ReactNode;
  hint?: (id: Id) => SectionHint | null;
  /** Pages of their own that people look for among the settings: found by the search. */
  related?: RelatedLink[];
  /** Shown when the person may see no section at all. */
  noAccess: ReactNode;
}

/** The nearest ancestor that scrolls: the dashboard's content, or a panel. */
function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
  }
  return null;
}

/**
 * A settings page with a menu and a page per section. Wide, the title and the search head the
 * page and the menu and the section each scroll on their own; narrow, the list and a section take
 * turns. Leaving a form with unsaved changes asks first.
 */
export default function SettingsMenuLayout<Id extends string>(props: Props<Id>) {
  const { title, subtitle, sections, groups, sectionTitle, requested, basePath, onChooseInPlace, wide, renderSection, sectionBadge, hint, related, noAccess } = props;
  const navigate = useNavigate();
  const confirmLeave = useLeaveGuard();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  // Beside the menu the page itself does not scroll: it fills the visible area
  const [pageHeight, setPageHeight] = useState<number>();

  const view = resolveMenuView(requested, sections, wide);
  const currentId = view.kind === "section" ? view.id : null;

  // The bare address and sections someone may not open land on a section, or the list, without a history entry
  useEffect(() => {
    if (view.kind !== "redirect") return;
    if (basePath) navigate(view.to ? `${basePath}/${view.to}` : basePath, { replace: true });
    else onChooseInPlace?.(view.to ?? undefined);
  }, [view.kind, view.kind === "redirect" ? view.to : null]);

  // After choosing a section it starts at the top, and the keyboard and screen readers at its title
  useEffect(() => {
    if (moved.current) {
      const scroller = wide ? contentRef.current : scrollParent(rootRef.current);
      if (scroller && scroller.scrollTop > 0) scroller.scrollTo({ top: 0 });
      if (currentId) headingRef.current?.focus({ preventScroll: true });
    }
    moved.current = false;
  }, [currentId]);

  useEffect(() => {
    if (!wide) return;
    const scroller = rootRef.current?.closest<HTMLElement>("[data-scroll-root]");
    if (!scroller) return;
    // 48px: the main area's own top and bottom padding
    const observer = new ResizeObserver(() => setPageHeight(scroller.clientHeight - 48));
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [wide]);

  const go = (id: Id | null) => {
    confirmLeave(() => {
      moved.current = true;
      if (basePath) navigate(id ? `${basePath}/${id}` : basePath);
      else onChooseInPlace?.(id ?? undefined);
    });
  };

  const header = (
    <div className={wide ? "px-2.5" : "mb-4"}>
      <h1 className="text-lg font-body-bold text-heading">{title}</h1>
      {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
    </div>
  );

  if (view.kind === "none") {
    return (
      <div className="w-full">
        {header}
        {noAccess}
      </div>
    );
  }

  const nav = (variant: "menu" | "index") => (
    <SettingsMenuNav
      sections={sections}
      groups={groups}
      current={currentId}
      title={sectionTitle}
      hint={hint}
      hrefFor={basePath ? (id) => `${basePath}/${id}` : undefined}
      onSelect={go}
      variant={variant}
    />
  );

  const search = (
    <SettingsMenuSearch
      sections={sections}
      title={sectionTitle}
      onSelect={go}
      related={related}
      onRelated={(path) => confirmLeave(() => navigate(path))}
      large={!wide}
    />
  );

  const danger = (id: Id) => !!groups.find((g) => g.id === sections.find((s) => s.id === id)?.group)?.danger;

  const section = currentId && (
    // The line-length cap only matters beside the menu; narrow, the card takes the whole width
    <section aria-labelledby="settings-section-title" className={wide ? "min-w-0 max-w-3xl" : "min-w-0"}>
      {!wide && (
        <button
          type="button"
          onClick={() => go(null)}
          className="inline-flex items-center gap-1.5 min-h-10 -ml-2 px-2 mb-2 rounded-lg text-sm font-body-medium text-secondary-text hover:bg-surface-hover hover:text-heading cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3.5 5.5 8l4.5 4.5" /></svg>
          {title}
        </button>
      )}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <h2
            id="settings-section-title"
            ref={headingRef}
            tabIndex={-1}
            className={danger(currentId) ? "text-base font-body-bold text-red-700 dark:text-red-400 outline-none" : "text-base font-body-bold text-heading outline-none"}
          >
            {sectionTitle(currentId)}
          </h2>
          {sectionBadge?.(currentId)}
        </div>
        {renderSection(currentId)}
      </Card>
    </section>
  );

  if (!wide) {
    return (
      // Narrow means a phone or a panel: the list and the section take its whole width
      <div ref={rootRef} className="w-full">
        {view.kind === "index" ? <>{header}<div className="mb-5">{search}</div>{nav("index")}</> : section}
      </div>
    );
  }

  return (
    // The title heads the menu column; the search, which looks through every section, heads the content
    <div
      ref={rootRef}
      style={{ height: pageHeight }}
      className="w-full grid grid-cols-[208px_minmax(0,1fr)] lg:grid-cols-[232px_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-x-6 lg:gap-x-8 gap-y-5"
    >
      {header}
      <div className="max-w-md w-full self-end">{search}</div>
      <aside className="min-h-0 overflow-y-auto overscroll-contain pr-1 pb-2 [scrollbar-width:thin]">
        {nav("menu")}
      </aside>
      <div ref={contentRef} className="min-h-0 overflow-y-auto overscroll-contain pr-1 pb-2 [scrollbar-width:thin]">
        {section}
      </div>
    </div>
  );
}
