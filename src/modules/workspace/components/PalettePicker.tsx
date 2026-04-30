import { useState } from "react";
import clsx from "clsx";
import { PALETTES, DEFAULT_PALETTE } from "../domain/palettes";
import useTranslation from "@modules/app/i18n/useTranslation";
import CustomPaletteModal from "./CustomPaletteModal";

interface Props {
  value: string | null;
  onChange: (palette: string) => void;
  disabled?: boolean;
}

function isCustomPalette(value: string | null): boolean {
  return !!value && value.startsWith("custom:");
}

function getCustomHex(value: string): string {
  return value.replace("custom:", "");
}

export default function PalettePicker({ value, onChange, disabled }: Props) {
  const active = value ?? DEFAULT_PALETTE;
  const { lang, t } = useTranslation();
  const [showCustom, setShowCustom] = useState(false);

  const isCustomActive = isCustomPalette(active);
  const customHex = isCustomActive ? getCustomHex(active) : "#059669";

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {Object.values(PALETTES).map((p) => (
          <button
            key={p.name}
            type="button"
            disabled={disabled}
            onClick={() => onChange(p.name)}
            className="group flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div
              className={clsx(
                "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                active === p.name
                  ? "border-heading scale-110"
                  : "border-transparent hover:scale-105",
              )}
              style={{ backgroundColor: p.swatch }}
            >
              {active === p.name && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={clsx(
              "text-exs font-body-medium",
              active === p.name ? "text-heading" : "text-muted",
            )}>
              {p.label[lang as 'en' | 'es'] ?? p.label.en}
            </span>
          </button>
        ))}

        {/* Custom color button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowCustom(true)}
          className="group flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCustomActive ? (
            <div
              className="w-8 h-8 rounded-full border-2 border-heading scale-110 transition-all flex items-center justify-center"
              style={{ backgroundColor: customHex }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-subtle transition-all flex items-center justify-center hover:scale-105 hover:border-muted">
              <svg className="w-3.5 h-3.5 text-subtle group-hover:text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
          )}
          <span className={clsx(
            "text-exs font-body-medium",
            isCustomActive ? "text-heading" : "text-muted",
          )}>
            {t("customPalette.custom")}
          </span>
        </button>
      </div>

      {showCustom && (
        <CustomPaletteModal
          initialColor={customHex}
          onApply={(hex) => {
            onChange(`custom:${hex}`);
            setShowCustom(false);
          }}
          onClose={() => setShowCustom(false)}
        />
      )}
    </>
  );
}
