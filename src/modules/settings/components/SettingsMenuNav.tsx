import { Fragment, useId } from "react";
import { Link } from "react-router";
import clsx from "clsx";
import useTranslation from "@modules/app/i18n/useTranslation";
import { MenuSection } from "../domain/settings-menu";

/** A group of sections in the menu. Without a title its sections stand on their own, unindented. */
export interface MenuGroup {
  id: string;
  title?: string;
  /** Set apart below a line and in red: deleting things. */
  danger?: boolean;
}

/** A short state of a section, such as whether the portal is open. */
export interface SectionHint {
  label: string;
  tone: "on" | "off" | "pending";
}

interface Props<Id extends string> {
  sections: MenuSection<Id>[];
  groups: MenuGroup[];
  current: Id | null;
  title: (id: Id) => string;
  /** Shown only in the phone list: beside the section its header already says it. */
  hint?: (id: Id) => SectionHint | null;
  /** The section's own URL; without it (inside a panel) the entries are buttons. */
  hrefFor?: (id: Id) => string;
  onSelect: (id: Id) => void;
  /** `menu` sits beside the section; `index` is the whole screen on a phone or in a panel. */
  variant: "menu" | "index";
}

const plainClick = (e: React.MouseEvent) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0);

/** A settings menu: the sections grouped by what they are for. */
export default function SettingsMenuNav<Id extends string>({ sections, groups, current, title, hint, hrefFor, onSelect, variant }: Props<Id>) {
  const { t } = useTranslation();
  const baseId = useId();
  const isIndex = variant === "index";
  const groupOf = (id: string) => groups.find((g) => g.id === id);

  const select = (e: React.MouseEvent, id: Id) => {
    if (!plainClick(e)) return;
    e.preventDefault();
    onSelect(id);
  };

  const entry = (section: MenuSection<Id>) => {
    const active = section.id === current;
    const group = groupOf(section.group);
    const danger = !!group?.danger;
    const state = hint?.(section.id) ?? null;
    // Under a group title the entries are indented, so the title reads as a heading and not as one more entry
    const indent = !!group?.title;
    const className = isIndex
      ? clsx(
          "w-full min-h-12 flex items-center gap-2 px-3.5 text-left text-sm transition-colors cursor-pointer hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
          danger ? "text-red-700 dark:text-red-400" : "text-body",
        )
      : clsx(
          "w-full h-7 flex items-center gap-2 pr-2.5 rounded-md text-left text-sm leading-5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
          indent ? "pl-5" : "pl-2.5",
          active
            ? "bg-surface-active text-primary font-body-semibold shadow-[inset_2px_0_0_var(--color-primary)]"
            : clsx("hover:bg-surface-hover", danger ? "text-red-700 dark:text-red-400" : "text-secondary-text"),
        );
    const content = (
      <>
        <span className="flex-1 min-w-0 truncate">{title(section.id)}</span>
        {state && isIndex && <span className="shrink-0 text-xs text-muted">{state.label}</span>}
        {isIndex && <span aria-hidden="true" className="text-subtle">›</span>}
      </>
    );
    return (
      <li key={section.id}>
        {hrefFor ? (
          <Link to={hrefFor(section.id)} onClick={(e) => select(e, section.id)} aria-current={active ? "page" : undefined} className={className}>
            {content}
          </Link>
        ) : (
          <button type="button" onClick={(e) => select(e, section.id)} aria-current={active ? "page" : undefined} className={className}>
            {content}
          </button>
        )}
      </li>
    );
  };

  // On the phone each group is a card of rows; beside the section, a plain list
  const list = (items: MenuSection<Id>[], labelledBy?: string) => (
    <ul
      aria-labelledby={labelledBy}
      className={isIndex
        ? "bg-surface border border-border-card rounded-card overflow-hidden divide-y divide-border-card"
        : "flex flex-col gap-px"}
    >
      {items.map(entry)}
    </ul>
  );

  return (
    <nav aria-label={t("settingsNav.label")} className="flex flex-col">
      {groups.map((group, index) => {
        const items = sections.filter((s) => s.group === group.id);
        if (items.length === 0) return null;
        const headingId = `${baseId}-${group.id}`;
        return (
          <Fragment key={group.id}>
            <div className={clsx(index > 0 && (isIndex ? "mt-4" : "mt-5"), group.danger && !isIndex && "border-t border-border-input pt-2")}>
              {group.title && (
                <h2 id={headingId} className={isIndex ? "text-xs font-body-semibold text-heading px-1 mb-1.5" : "text-xs font-body-semibold text-heading px-2.5 mb-1"}>
                  {group.title}
                </h2>
              )}
              {list(items, group.title ? headingId : undefined)}
            </div>
          </Fragment>
        );
      })}
    </nav>
  );
}
