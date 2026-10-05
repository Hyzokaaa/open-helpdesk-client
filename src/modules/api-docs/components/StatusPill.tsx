import clsx from "clsx";

export default function StatusPill({ status }: { status: string | number }) {
  const code = String(status);
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded px-1.5 py-px font-mono text-xs font-bold shrink-0",
        code.startsWith("2") && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        code.startsWith("3") && "bg-sky-500/15 text-sky-700 dark:text-sky-300",
        code.startsWith("4") && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        (code.startsWith("5") || code === "0") && "bg-red-500/15 text-red-700 dark:text-red-300",
      )}
    >
      {code}
    </span>
  );
}
