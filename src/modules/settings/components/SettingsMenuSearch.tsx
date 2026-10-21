import { useEffect, useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import useTranslation from "@modules/app/i18n/useTranslation";
import { MenuSection, foldText, searchMenu } from "../domain/settings-menu";

export interface RelatedLink {
  label: string;
  path: string;
}

interface Props<Id extends string> {
  sections: MenuSection<Id>[];
  title: (id: Id) => string;
  onSelect: (id: Id) => void;
  /** Pages of their own that people look for among the settings, offered when the search matches them. */
  related?: RelatedLink[];
  onRelated?: (path: string) => void;
  /** 16px on a phone, so iOS does not zoom in on focus. */
  large?: boolean;
}

type Option<Id extends string> = { kind: "section"; id: Id; field: string | null } | { kind: "page"; link: RelatedLink };


/**
 * Searches every setting, by section and by the fields inside it, and lists what it finds right
 * under the field: a combobox, driven with the arrow keys, Enter and Escape.
 */
export default function SettingsMenuSearch<Id extends string>({ sections, title, onSelect, related = [], onRelated, large }: Props<Id>) {
  const { t, lang } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const options = useMemo<Option<Id>[]>(() => {
    const found: Option<Id>[] = searchMenu(sections, query, title, lang).map((r) => ({ kind: "section", id: r.id, field: r.field }));
    const ws = foldText(query).split(/\s+/).filter(Boolean);
    const pages: Option<Id>[] = ws.length === 0 ? [] : related
      .filter((link) => ws.every((w) => foldText(link.label).includes(w)))
      .map((link) => ({ kind: "page", link }));
    return [...found, ...pages];
  }, [sections, query, title, lang, related]);

  const searching = query.trim() !== "";
  const expanded = open && searching;

  useEffect(() => setActive(0), [query]);

  // "/" or Ctrl/Cmd+K jumps to the search from anywhere on the page, except while typing elsewhere
  useEffect(() => {
    const focusSearch = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        document.getElementById(inputId)?.focus();
      }
    };
    document.addEventListener("keydown", focusSearch);
    return () => document.removeEventListener("keydown", focusSearch);
  }, [inputId]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const choose = (option: Option<Id>) => {
    setQuery("");
    setOpen(false);
    if (option.kind === "section") onSelect(option.id);
    else onRelated?.(option.link.path);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (searching) e.preventDefault();
      setQuery("");
      setOpen(false);
    } else if (e.key === "ArrowDown" && options.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp" && options.length > 0) {
      e.preventDefault();
      setActive((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Enter" && expanded && options[active]) {
      e.preventDefault();
      choose(options[active]);
    }
  };

  const optionId = (i: number) => `${listId}-${i}`;
  const firstPage = options.findIndex((o) => o.kind === "page");

  return (
    <div ref={rootRef} className="relative w-full">
      <label htmlFor={inputId} className="sr-only">{t("settingsNav.search")}</label>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" />
      </svg>
      <input
        id={inputId}
        type="search"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && options[active] ? optionId(active) : undefined}
        autoComplete="off"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={t("settingsNav.search")}
        className={clsx(
          "w-full pl-9 pr-9 rounded-lg border border-border-input bg-surface text-body placeholder:text-muted focus:outline-2 focus:outline-offset-0 focus:outline-primary",
          large ? "h-11 text-base" : "h-9 text-sm",
        )}
      />
      {!large && !searching && (
        <kbd aria-hidden="true" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-exs text-subtle border border-border-input rounded px-1.5 leading-4 pointer-events-none">/</kbd>
      )}
      <p role="status" className="sr-only">{expanded ? t("settingsNav.results").replace("{count}", String(options.length)) : ""}</p>

      {expanded && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-surface border border-border-input rounded-lg shadow-lg py-1 max-h-80 overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted">{t("settingsNav.noResults").replace("{query}", query.trim())}</p>
          ) : (
            <ul id={listId} role="listbox" aria-label={t("settingsNav.search")}>
              {options.map((option, i) => (
                <li key={option.kind === "page" ? option.link.path : `${option.id}-${option.field ?? ""}`} role="presentation">
                  {i === firstPage && (
                    <p role="presentation" className="px-3 pt-2 pb-1 mt-1 border-t border-border-card text-exs font-body-bold text-heading">{t("settingsNav.otherPages")}</p>
                  )}
                  <div
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(option)}
                    className={clsx("flex items-baseline gap-2 px-3 py-1.5 text-sm cursor-pointer", i === active ? "bg-surface-hover text-heading" : "text-body")}
                  >
                    {option.kind === "section" ? (
                      option.field ? (
                        <>
                          <span className="truncate">{option.field}</span>
                          <span className="ml-auto shrink-0 text-xs text-muted">{title(option.id)}</span>
                        </>
                      ) : (
                        <span className="truncate font-body-medium">{title(option.id)}</span>
                      )
                    ) : (
                      <>
                        <span className="truncate">{option.link.label}</span>
                        <span aria-hidden="true" className="ml-auto text-subtle">→</span>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
