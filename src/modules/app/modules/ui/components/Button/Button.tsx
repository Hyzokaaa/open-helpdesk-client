import clsx from "clsx";
import { forwardRef, ForwardedRef, useMemo } from "react";
import { Size } from "../../domain/size";
import Spinner from "../Spinner/Spinner";

interface Props {
  children?: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  full?: boolean;
  color?: "primary" | "light" | "danger" | "primary-light";
  size?: Size;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

function Button(
  {
    children,
    onClick,
    full,
    className,
    loading,
    disabled: idisabled,
    color = "primary",
    size = "sm",
    type = "button",
  }: Props,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const disabled = useMemo(() => idisabled || loading, [idisabled, loading]);

  const CLASS = clsx(
    "flex items-center justify-center",
    "transition-all duration-300",
    "whitespace-nowrap cursor-pointer",

    {
      "disabled:bg-secondary bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30":
        color === "primary",
      "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-700 border-button":
        color === "light",
      "bg-red-500 hover:bg-red-700 text-white": color === "danger",
      "border border-primary/20 hover:border-primary/40 hover:bg-primary/10 text-primary":
        color === "primary-light",
    },

    {
      "text-white": color === "primary",
      "text-gray-600 dark:text-gray-300": color === "light",
    },

    { "w-max": !full, "w-full": full },

    {
      "text-xs": size === "sm" || size === "xs",
      "text-sm": size === "base",
      "text-base": size === "lg",
    },

    "rounded-button",

    {
      "px-2 py-[5px]": size === "xs",
      "px-2.5 py-1.5": size === "sm",
      "px-3 py-1.5": size === "base",
      "px-4 py-2": size === "lg",
      "px-6 py-2.5": size === "xl",
    },

    { "gap-x-1.5": true },
    { "opacity-50 cursor-not-allowed": disabled },

    className,
  );

  return (
    <button
      disabled={disabled}
      type={type}
      className={CLASS}
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
    >
      {loading && (
        <Spinner
          mode={color === "primary" ? "light" : "dark"}
          width={12}
        />
      )}
      {children && <span className="font-body-semibold">{children}</span>}
    </button>
  );
}

export default forwardRef<HTMLButtonElement, Props>(Button);
