import { inputClass } from "@modules/app/modules/ui/shared/domain/input-class";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  category: string;
  /** Days typed so far ("" means follow the installation, for a workspace). */
  value: string;
  forever: boolean;
  onChange: (value: string) => void;
  onForeverChange: (forever: boolean) => void;
  /** A note under the category, such as the installation's minimum. */
  hint?: string;
  disabled?: boolean;
  placeholder?: string;
}

/** One audit category with its retention in days, or kept forever. */
export default function RetentionRow({ category, value, forever, onChange, onForeverChange, hint, disabled, placeholder }: Props) {
  const { t } = useTranslation();
  const key = `auditLog.category.${category}`;
  const label = t(key as never);

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-sm text-body">{label && label !== key ? label : category}</p>
        {hint && <p className="text-exs text-muted">{hint}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <input
          type="number"
          min={1}
          value={forever ? "" : value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || forever}
          className={inputClass({ size: "sm", full: false, disabled: disabled || forever, extra: "!w-24 text-right" })}
        />
        <span className="text-xs text-muted w-8">{t("auditRetention.days")}</span>
        <label className="flex items-center gap-1.5 text-xs text-body cursor-pointer">
          <input
            type="checkbox"
            checked={forever}
            onChange={(e) => onForeverChange(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 accent-primary"
          />
          {t("auditRetention.forever")}
        </label>
      </div>
    </div>
  );
}
