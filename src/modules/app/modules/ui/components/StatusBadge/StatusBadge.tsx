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
          "bg-primary-100 dark:bg-primary-950 text-primary": color === "primary",
          "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400": color === "yellow",
          "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400": color === "green",
          "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400": color === "red",
          "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300": color === "gray",
          "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400": color === "blue",
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
