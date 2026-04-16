import clsx from "clsx";

interface Props {
  label: string;
  color: "primary" | "yellow" | "green" | "red" | "gray" | "blue";
  size?: "sm" | "xs";
}

export default function StatusBadge({
  label,
  color,
  size = "sm",
}: Props) {
  return (
    <span
      className={clsx(
        "flex items-center rounded w-max font-body-medium",
        {
          "bg-primary-100 text-primary": color === "primary",
          "bg-yellow-100 text-yellow-600": color === "yellow",
          "bg-green-100 text-green-600": color === "green",
          "bg-red-100 text-red-600": color === "red",
          "bg-gray-100 text-gray-600": color === "gray",
          "bg-blue-100 text-blue-600": color === "blue",
        },
        {
          "px-2 py-1 text-xs": size === "sm",
          "px-1.5 py-0.5 text-exs": size === "xs",
        },
      )}
    >
      {label}
    </span>
  );
}
