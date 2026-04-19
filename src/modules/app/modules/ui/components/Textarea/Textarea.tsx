import clsx from "clsx";
import { Size } from "../../domain/size";

interface Props {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  size?: Size;
  height?: number;
  disabled?: boolean;
}

export default function Textarea({
  placeholder,
  size = "sm",
  value,
  onChange,
  height = 90,
  disabled = false,
}: Props) {
  return (
    <textarea
      placeholder={placeholder}
      className={clsx(
        "bg-surface rounded-input border-input transition-all duration-200",
        "outline-none text-body shadow-input w-full",
        { "border-input-effect": !disabled },
        {
          "px-4 py-2": size === "base" || size === "lg",
          "px-3 py-1.5": size === "sm",
          "px-2 py-0.5": size === "xs",
        },
        {
          "text-base": size === "base",
          "text-sm": size === "sm" || size === "xs",
        },
      )}
      value={value ?? ""}
      spellCheck={false}
      style={{ height: `${height}px` }}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}
