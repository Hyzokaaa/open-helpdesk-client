import clsx from "clsx";
import type { Size } from "../../domain/size";

interface Props {
  size: Size;
  extra?: string;
  full: boolean;
  disabled?: boolean;
}

export function inputClass({
  size,
  extra,
  full,
  disabled = false,
}: Props): string {
  return clsx(
    "h-max",
    disabled ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400" : "bg-white dark:bg-gray-800",
    "rounded-input",
    "border-input",
    "transition-all duration-200",
    "outline-none",
    "shadow-input",
    "text-gray-700 dark:text-gray-200",

    { "border-input-effect": !disabled },

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
