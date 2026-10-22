import { ReactNode } from "react";
import clsx from "clsx";
import useTranslation from "@modules/app/i18n/useTranslation";
import { PAGE_SIZES, getPageRange, pageItemRange, totalPages } from "@modules/app/domain/core/pagination";

interface Props {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  /** Offers the page sizes when given. */
  onLimitChange?: (limit: number) => void;
  /** What the list holds, in the plural and in the user's language ("tickets", "entries"). */
  noun: string;
  /** "sm" for short lists inside a card: smaller buttons and no page size. */
  size?: "md" | "sm";
  className?: string;
}

/** Fills "{from}" and the like with nodes, so the numbers can stand out within a translated text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, i) => {
    const key = part.match(/^\{(\w+)\}$/)?.[1];
    return key && key in values ? <span key={i}>{values[key]}</span> : part;
  });
}

const fillText = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m));

const Chevron = ({ d }: { d: string }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
    <path d={d} />
  </svg>
);

/**
 * The footer of a paged list: which items are shown out of how many, the pages with the current
 * one marked, and the page size. On a phone it keeps only the arrows and "Page 3 of 9". Hidden
 * when everything fits on one page and no page size is offered.
 */
export default function Pagination({ page, total, limit, onPageChange, onLimitChange, noun, size = "md", className }: Props) {
  const { t } = useTranslation();
  const pages = totalPages(total, limit);
  if (total === 0 || (pages <= 1 && (!onLimitChange || total <= PAGE_SIZES[0]))) return null;

  const { from, to } = pageItemRange(page, limit, total);
  const strong = (v: number) => <span className="text-body font-body-medium">{v}</span>;
  const rangeText = fillText(t("pagination.range"), { from, to, total, noun });
  const pageOf = fillText(t("pagination.pageOf"), { page, pages });
  const sm = size === "sm";

  const go = (p: number) => { if (p >= 1 && p <= pages && p !== page) onPageChange(p); };
  const arrow = (target: number, label: string, d: string) => {
    const disabled = target < 1 || target > pages;
    return (
      <button
        type="button"
        aria-label={label}
        aria-disabled={disabled || undefined}
        onClick={() => !disabled && go(target)}
        className={clsx(
          "rounded-md flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary-600",
          sm ? "w-8 h-8" : "w-11 h-11 sm:w-8 sm:h-8 border border-border-input sm:border-0",
          disabled ? "text-subtle/60 cursor-default" : "text-body hover:bg-surface-hover hover:text-heading cursor-pointer",
        )}
      >
        <Chevron d={d} />
      </button>
    );
  };

  return (
    <nav
      aria-label={fillText(t("pagination.label"), { noun })}
      // relative: the screen-reader status is absolute, and must not stretch the page from far below
      className={clsx("relative flex items-center justify-between gap-3", sm ? "pt-3" : "px-4 py-3 border-t border-border-card", className)}
    >
      <p role="status" className="sr-only">{`${rangeText}. ${pageOf}`}</p>
      <p aria-hidden="true" className={clsx("text-xs text-muted", sm ? "" : "hidden sm:block")}>
        {fill(t("pagination.range"), { from: strong(from), to: strong(to), total: strong(total), noun })}
      </p>

      <div className={clsx("flex items-center gap-1", sm ? "" : "flex-1 sm:flex-none justify-between sm:justify-center")}>
        {arrow(page - 1, t("pagination.previous"), "m12 5-5 5 5 5")}
        <div className={clsx("items-center gap-1", sm ? "hidden" : "hidden sm:flex")}>
          {getPageRange(page, pages).map((slot, i) =>
            slot === "gap" ? (
              <span key={`gap-${i}`} aria-hidden="true" className="w-8 text-center text-subtle">…</span>
            ) : (
              <button
                key={slot}
                type="button"
                aria-label={fillText(t("pagination.page"), { page: slot })}
                aria-current={slot === page ? "page" : undefined}
                onClick={() => go(slot)}
                className={clsx(
                  "min-w-8 h-8 px-2 rounded-md text-sm flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary-600",
                  slot === page
                    ? "bg-surface-active text-primary font-body-semibold ring-1 ring-inset ring-primary-200 cursor-default"
                    : "text-body hover:bg-surface-hover hover:text-heading cursor-pointer",
                )}
              >
                {slot}
              </button>
            ),
          )}
        </div>
        <div aria-hidden="true" className={clsx("text-center leading-tight", sm ? "text-xs text-muted px-1" : "sm:hidden")}>
          <p className={sm ? "" : "text-sm font-body-semibold text-heading"}>{pageOf}</p>
          {!sm && <p className="text-xs text-muted">{fillText(t("pagination.rangeShort"), { from, to, total })}</p>}
        </div>
        {arrow(page + 1, t("pagination.next"), "m8 5 5 5-5 5")}
      </div>

      {onLimitChange && !sm && (
        <label className="hidden sm:flex items-center gap-2 text-xs text-muted">
          {t("pagination.perPage")}
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="h-8 rounded-md border border-border-input bg-surface text-sm text-body pl-2 pr-7 cursor-pointer"
          >
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}
    </nav>
  );
}
