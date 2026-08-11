import clsx from "clsx";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  selected: string;
  onChange: (preset: string) => void;
}

const PRESETS = [
  { key: "7d", labelKey: "reports.last7d" },
  { key: "30d", labelKey: "reports.last30d" },
  { key: "90d", labelKey: "reports.last90d" },
  { key: "all", labelKey: "reports.all" },
] as const;

export default function DateRangeSelector({ selected, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-1">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={clsx(
            "px-3 py-1.5 rounded text-sm font-body-medium transition-colors cursor-pointer",
            selected === p.key
              ? "bg-primary-600 text-on-primary"
              : "text-muted hover:bg-surface-hover",
          )}
        >
          {t(p.labelKey)}
        </button>
      ))}
    </div>
  );
}
