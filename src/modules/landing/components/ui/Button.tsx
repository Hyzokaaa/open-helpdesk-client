import clsx from "clsx";

interface Props {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "base" | "lg";
  className?: string;
}

export default function Button({
  children,
  href,
  onClick,
  variant = "primary",
  size = "base",
  className,
}: Props) {
  const cls = clsx(
    "inline-flex items-center justify-center font-body-semibold rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap",
    {
      "bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02]":
        variant === "primary",
      "border border-border-input text-heading hover:border-primary hover:text-primary":
        variant === "outline",
      "text-heading hover:text-primary": variant === "ghost",
    },
    {
      "px-4 py-2 text-sm": size === "sm",
      "px-6 py-2.5 text-sm": size === "base",
      "px-8 py-3.5 text-base": size === "lg",
    },
    className,
  );

  if (href) {
    return (
      <a href={href} className={cls} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
