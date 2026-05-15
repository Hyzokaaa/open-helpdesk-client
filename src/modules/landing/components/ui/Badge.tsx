import clsx from "clsx";

interface Props {
  children: React.ReactNode;
  variant?: "primary" | "outline";
}

export default function Badge({ children, variant = "primary" }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-body-semibold",
        {
          "bg-primary-100 text-primary": variant === "primary",
          "border border-border-input text-muted": variant === "outline",
        },
      )}
    >
      {children}
    </span>
  );
}
