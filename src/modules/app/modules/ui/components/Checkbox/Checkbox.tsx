import clsx from "clsx";
import type { ReactNode } from "react";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  /** A quieter line under the label. */
  hint?: ReactNode;
  disabled?: boolean;
  /** "xs" for dense lists such as API key scopes or webhook events. */
  size?: "sm" | "xs";
  /** Spacing around the whole control. */
  className?: string;
  /** Extra lines under the label and hint. */
  children?: ReactNode;
}

/** A checkbox with its label, for choosing items in a form; on/off settings use Switch. */
export default function Checkbox({ checked, onChange, label, hint, disabled = false, size = "sm", className, children }: Props) {
  const hasText = label !== undefined || hint !== undefined || children !== undefined;

  return (
    <label className={clsx("flex items-start gap-2", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer", className)}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={clsx("accent-primary shrink-0", size === "xs" ? "w-3.5 h-3.5 mt-px" : "w-4 h-4 mt-0.5")}
      />
      {hasText && (
        <span className="min-w-0">
          {label !== undefined && <span className={clsx("block text-body", size === "xs" ? "text-xs" : "text-sm")}>{label}</span>}
          {hint !== undefined && <span className="block text-exs text-muted break-words">{hint}</span>}
          {children}
        </span>
      )}
    </label>
  );
}
