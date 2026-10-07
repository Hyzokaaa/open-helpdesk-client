import { useState } from "react";
import clsx from "clsx";
import { inputClass } from "@modules/app/modules/ui/shared/domain/input-class";
import useTranslation from "@modules/app/i18n/useTranslation";

export interface RetentionDraftRow {
  value: string;
  forever: boolean;
}

interface Props {
  category: string;
  value: string;
  forever: boolean;
  /** Allowed days: the server rejects anything outside them, so the row says so as it is typed. */
  min: number;
  max: number;
  /** What an emptied field goes back to when it loses focus. */
  fallback: number;
  onChange: (value: string) => void;
  onForeverChange: (forever: boolean) => void;
  /** A note under the category, such as its minimum. */
  hint?: string;
  disabled?: boolean;
}

/** Whether a row can be saved: kept forever, or whole days within the range. */
export function retentionRowValid(row: RetentionDraftRow | undefined, min: number, max: number): boolean {
  if (!row || row.forever) return true;
  if (!/^\d+$/.test(row.value)) return false;
  const days = Number(row.value);
  return days >= min && days <= max;
}

/** One audit category with its retention in days, or kept forever. */
export default function RetentionRow({
  category, value, forever, min, max, fallback, onChange, onForeverChange, hint, disabled,
}: Props) {
  const { t } = useTranslation();
  const [adjusted, setAdjusted] = useState<string | null>(null);
  const key = `auditLog.category.${category}`;
  const label = t(key as never);
  const invalid = !retentionRowValid({ value, forever }, min, max);

  const type = (raw: string) => {
    setAdjusted(null);
    onChange(raw.replace(/\D/g, "").slice(0, 5));
  };

  // Out-of-range days are only corrected on blur: clamping while typing would turn the 4 of 400 into the minimum
  const blur = () => {
    if (forever) return;
    if (value === "") {
      onChange(String(fallback));
      return;
    }
    const days = Number(value);
    if (days < min) {
      onChange(String(min));
      setAdjusted(t("auditRetention.raised").replace("{days}", String(min)));
    } else if (days > max) {
      onChange(String(max));
      setAdjusted(t("auditRetention.lowered").replace("{days}", String(max)));
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm text-body">{label && label !== key ? label : category}</p>
        {hint && <p className={clsx("text-exs", invalid ? "text-red-600 dark:text-red-400" : "text-muted")}>{hint}</p>}
        {adjusted && <p className="text-exs text-amber-700 dark:text-amber-300">{adjusted}</p>}
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="relative w-28">
          <input
            type="text"
            inputMode="numeric"
            aria-label={label && label !== key ? label : category}
            aria-invalid={invalid}
            value={forever ? "" : value}
            placeholder={forever ? "—" : undefined}
            onChange={(e) => type(e.target.value)}
            onBlur={blur}
            disabled={disabled || forever}
            className={inputClass({ size: "sm", full: true, disabled: disabled || forever, invalid, extra: "text-right !pr-11" })}
          />
          <span className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none", forever ? "text-muted opacity-50" : "text-muted")}>
            {t("auditRetention.days")}
          </span>
        </div>
        <label className={clsx("flex items-center gap-1.5 text-xs text-body w-20", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
          <input
            type="checkbox"
            checked={forever}
            onChange={(e) => { setAdjusted(null); onForeverChange(e.target.checked); }}
            disabled={disabled}
            className="w-4 h-4 accent-primary"
          />
          {t("auditRetention.forever")}
        </label>
      </div>
    </div>
  );
}
