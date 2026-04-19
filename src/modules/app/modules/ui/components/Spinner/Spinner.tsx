import clsx from "clsx";

interface Props {
  width?: number;
  mode?: "light" | "dark";
  className?: string;
}

export default function Spinner({
  width = 16,
  mode = "dark",
  className,
}: Props) {
  return (
    <div
      className={clsx(
        "border-2 rounded-full animate-spin",
        {
          "border-white/30 border-t-white": mode === "light",
          "border-gray-200 dark:border-gray-600 border-t-gray-500 dark:border-t-gray-300": mode === "dark",
        },
        className,
      )}
      style={{ width, height: width }}
    />
  );
}
