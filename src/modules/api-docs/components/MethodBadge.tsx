import clsx from "clsx";

const COLORS: Record<string, string> = {
  get: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  post: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  put: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  patch: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  delete: "bg-red-500/15 text-red-700 dark:text-red-300",
};

interface Props {
  method: string;
  size?: "sm" | "md";
}

export default function MethodBadge({ method, size = "md" }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded font-mono font-bold uppercase shrink-0",
        size === "sm" ? "text-[10px] w-12 py-px" : "text-xs px-2 py-0.5",
        COLORS[method] ?? "bg-surface-hover text-body",
      )}
    >
      {method === "delete" && size === "sm" ? "del" : method}
    </span>
  );
}
