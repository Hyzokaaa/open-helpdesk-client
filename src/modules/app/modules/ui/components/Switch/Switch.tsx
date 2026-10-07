import clsx from "clsx";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** For screen readers when no visible label is attached to the switch. */
  label?: string;
}

/** The on/off switch used across settings and notification preferences. */
export default function Switch({ checked, onChange, disabled, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={clsx(
        "w-8 h-[18px] rounded-full transition-colors cursor-pointer shrink-0 p-[2px] flex",
        checked ? "bg-primary justify-end" : "bg-subtle justify-start",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      <span className="block w-[14px] h-[14px] rounded-full bg-white shadow-sm" />
    </button>
  );
}
