import clsx from "clsx";
import type { Size } from "../../domain/size";

interface Props {
  size: Size;
  extra?: string;
  full: boolean;
  disabled?: boolean;
  /** Out of range or otherwise wrong: red border while it stays editable. */
  invalid?: boolean;
}

export function inputClass({
  size,
  extra,
  full,
  disabled = false,
  invalid = false,
}: Props): string {
  return clsx(
    "h-max",
    disabled ? "bg-surface-disabled text-muted" : "bg-surface",
    "rounded-input",
    "border-input",
    "transition-all duration-200",
    "outline-none",
    "shadow-input",
    "text-body",

    { "border-input-effect": !disabled && !invalid },
    { "!border-red-500 focus:ring-2 focus:ring-red-500/20": invalid },

    {
      "px-5 py-2": size === "lg" || size === "xl",
      "px-4 py-1.5": size === "base",
      "px-3 py-1": size === "sm",
      "px-2 py-0.5": size === "xs",
    },

    {
      "text-base": size === "base",
      "text-sm": size === "sm" || size === "xs",
      "text-lg": size === "lg",
      "text-xl": size === "xl",
    },

    { "w-full": full, "w-[60px]": !full },

    extra,
  );
}
