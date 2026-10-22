import { ReactNode } from "react";
import clsx from "clsx";
import NavIcon, { NavIconName } from "@modules/app/components/nav-icons";

interface Props {
  /** The page's icon in the sidebar, so the empty page is recognisably the same place. */
  icon: NavIconName;
  title: string;
  description?: string;
  /** A button or link: creating the first item, or clearing the filters. Left out without permission. */
  action?: ReactNode;
  /**
   * "empty": nothing here yet, in the palette colour, inviting to create. "no-results": there are
   * items but the search or the filters match none, in grey with a magnifier.
   */
  variant?: "empty" | "no-results";
  /** "sm" inside a table or a panel: less height and no description. */
  size?: "md" | "sm";
  /** In a card of its own, where the list would be. */
  bordered?: boolean;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, variant = "empty", size = "md", bordered = false, className }: Props) {
  const noResults = variant === "no-results";
  const sm = size === "sm";
  return (
    <div className={clsx("flex flex-col items-center text-center px-4", sm ? "py-8" : "py-16", bordered && "bg-surface border border-border-card rounded-lg", className)}>
      <div
        aria-hidden="true"
        className={clsx(
          "relative w-12 h-12 rounded-full flex items-center justify-center mb-3",
          noResults ? "bg-surface-hover text-muted" : "bg-surface-active text-primary",
        )}
      >
        <NavIcon name={icon} sizeClass="w-6 h-6" />
        {noResults && (
          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-surface border border-border-input flex items-center justify-center text-muted">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-3 h-3">
              <circle cx="9" cy="9" r="5" />
              <path d="m13 13 4 4" />
            </svg>
          </span>
        )}
      </div>
      <p className="text-sm font-body-semibold text-heading">{title}</p>
      {description && !sm && <p className="text-sm text-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
