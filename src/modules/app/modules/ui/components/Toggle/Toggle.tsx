import clsx from "clsx";

interface Props {
  left: string;
  right: string;
  active: "left" | "right";
  onChange: (value: "left" | "right") => void;
  badge?: string;
  /** Shows the active option at full contrast but does not let it change. */
  disabled?: boolean;
}

export default function Toggle({ left, right, active, onChange, badge, disabled = false }: Props) {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="relative inline-flex bg-gray-100 dark:bg-gray-800 rounded-full p-1">
        <button
          type="button"
          aria-pressed={active === "left"}
          disabled={disabled}
          onClick={() => onChange("left")}
          className={clsx(
            "relative z-10 px-4 py-1.5 text-sm font-body-medium rounded-full transition-all duration-300",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
            active === "left" ? "bg-surface text-heading shadow-sm" : disabled ? "text-muted opacity-60" : "text-muted",
          )}
        >
          {left}
        </button>
        <button
          type="button"
          aria-pressed={active === "right"}
          disabled={disabled}
          onClick={() => onChange("right")}
          className={clsx(
            "relative z-10 px-4 py-1.5 text-sm font-body-medium rounded-full transition-all duration-300",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
            active === "right" ? "bg-surface text-heading shadow-sm" : disabled ? "text-muted opacity-60" : "text-muted",
          )}
        >
          {right}
        </button>
      </div>
      {badge && (
        <span className="text-xs font-body-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}
