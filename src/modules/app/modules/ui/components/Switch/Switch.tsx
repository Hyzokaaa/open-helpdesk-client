import clsx from "clsx";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** For screen readers when no visible label is attached to the switch. */
  label?: string;
  /** The id of the visible text that names the switch; preferred over `label`. */
  labelledBy?: string;
  /** The id of the text that explains it, read after the name. */
  describedBy?: string;
  /** While a change is being saved: announced, and the switch does not move until it is done. */
  busy?: boolean;
}

/**
 * The on/off switch used across settings and notification preferences. Off uses the muted colour,
 * which keeps 3:1 against the page in both themes; a wider invisible area around it makes it easy
 * to hit (WCAG 2.5.8).
 */
export default function Switch({ checked, onChange, disabled, label, labelledBy, describedBy, busy }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-busy={busy || undefined}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); if (!busy) onChange(!checked); }}
      className={clsx(
        "relative w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0 p-[2px] flex",
        "before:absolute before:-inset-x-1 before:-inset-y-1.5 before:content-['']",
        "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary",
        checked ? "bg-primary justify-end" : "bg-muted justify-start",
        disabled && "opacity-40 cursor-not-allowed",
        busy && "cursor-progress",
      )}
    >
      <span className="block w-4 h-4 rounded-full bg-white shadow-sm" />
    </button>
  );
}
