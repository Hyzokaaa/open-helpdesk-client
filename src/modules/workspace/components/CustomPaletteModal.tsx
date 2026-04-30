import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import { generateScale, hexToRgbString, isValidHex, hexToHsv, hsvToHex } from "../domain/color-scale";

interface Props {
  initialColor: string;
  onApply: (hex: string) => void;
  onClose: () => void;
}

function useDrag(onMove: (x: number, y: number, rect: DOMRect) => void) {
  const dragging = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    onMove(x, y, rect);
  }, [onMove]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return { ref, onPointerDown, onPointerMove, onPointerUp };
}

export default function CustomPaletteModal({ initialColor, onApply, onClose }: Props) {
  const [hsv, setHsv] = useState(() => hexToHsv(initialColor));
  const [hexInput, setHexInput] = useState(initialColor);
  const { t } = useTranslation();

  const [h, s, v] = hsv;
  const color = hsvToHex(h, s, v);
  const hueColor = hsvToHex(h, 100, 100);
  const scale = generateScale(color);
  const accentRgb = hexToRgbString(color);

  useEffect(() => {
    setHexInput(color);
  }, [color]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleHexInput = (value: string) => {
    const hex = value.startsWith('#') ? value : `#${value}`;
    setHexInput(hex);
    if (isValidHex(hex)) {
      setHsv(hexToHsv(hex.toLowerCase()));
    }
  };

  const svDrag = useDrag(useCallback((x: number, y: number) => {
    setHsv(([h]) => [h, x * 100, (1 - y) * 100]);
  }, []));

  const hueDrag = useDrag(useCallback((x: number) => {
    setHsv(([, s, v]) => [x * 360, s, v]);
  }, []));

  const shadeOrder = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4">
          <h3 className="text-base font-body-bold text-heading">
            {t("customPalette.title")}
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {t("customPalette.description")}
          </p>
        </div>

        <div className="px-6 space-y-4">
          {/* Saturation/Brightness area */}
          <div
            ref={svDrag.ref}
            onPointerDown={svDrag.onPointerDown}
            onPointerMove={svDrag.onPointerMove}
            onPointerUp={svDrag.onPointerUp}
            className="relative w-full h-44 rounded-lg cursor-crosshair select-none touch-none"
            style={{ backgroundColor: hueColor }}
          >
            <div className="absolute inset-0 rounded-lg" style={{ background: "linear-gradient(to right, #fff, transparent)" }} />
            <div className="absolute inset-0 rounded-lg" style={{ background: "linear-gradient(to bottom, transparent, #000)" }} />
            {/* Thumb */}
            <div
              className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{
                left: `${s}%`,
                top: `${100 - v}%`,
                backgroundColor: color,
              }}
            />
          </div>

          {/* Hue bar */}
          <div
            ref={hueDrag.ref}
            onPointerDown={hueDrag.onPointerDown}
            onPointerMove={hueDrag.onPointerMove}
            onPointerUp={hueDrag.onPointerUp}
            className="relative w-full h-3 rounded-full cursor-pointer select-none touch-none"
            style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
          >
            <div
              className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 top-1/2 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{
                left: `${(h / 360) * 100}%`,
                backgroundColor: hueColor,
              }}
            />
          </div>

          {/* Color swatch + Hex input row */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border border-border-input shadow-sm shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1">
              <div className="flex items-center border-input rounded-input bg-surface shadow-input">
                <span className="pl-3 text-sm text-muted">#</span>
                <input
                  type="text"
                  value={hexInput.replace('#', '')}
                  onChange={(e) => handleHexInput(e.target.value)}
                  maxLength={6}
                  className="w-full px-1 py-2 text-sm font-body-medium text-body bg-transparent outline-none"
                  placeholder="059669"
                />
              </div>
            </div>
          </div>

          {/* Scale preview */}
          <div>
            <p className="text-exs font-body-medium text-subtle uppercase mb-2">
              {t("customPalette.scalePreview")}
            </p>
            <div className="flex rounded-lg overflow-hidden h-8">
              {shadeOrder.map((shade) => (
                <div
                  key={shade}
                  className="flex-1 relative group"
                  style={{ backgroundColor: scale[shade] }}
                >
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[9px] font-body-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: parseInt(shade) >= 500 ? '#fff' : '#000' }}
                  >
                    {shade}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* UI Preview — Light & Dark */}
          <div>
            <p className="text-exs font-body-medium text-subtle uppercase mb-2">
              {t("customPalette.uiPreview")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {/* Light preview */}
              <div className="rounded-lg border border-gray-200 p-3 flex flex-col gap-2" style={{ backgroundColor: '#ffffff' }}>
                <span className="text-[9px] font-body-medium uppercase" style={{ color: '#9ca3af' }}>Light</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded-md text-[10px] font-body-semibold text-white"
                    style={{ backgroundImage: `linear-gradient(to right, ${scale['600']}, ${scale['800']})` }}
                  >
                    {t("customPalette.previewButton")}
                  </button>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-body-medium"
                    style={{ backgroundColor: scale['50'], color: scale['700'] }}
                  >
                    Badge
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-body-medium" style={{ color: scale['600'] }}>
                    {t("customPalette.previewLink")}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-body-medium"
                    style={{ backgroundColor: `rgb(${accentRgb} / 0.1)`, color: scale['600'] }}
                  >
                    {t("customPalette.previewActive")}
                  </span>
                </div>
              </div>

              {/* Dark preview */}
              <div className="rounded-lg border border-gray-700 p-3 flex flex-col gap-2" style={{ backgroundColor: '#1f2937' }}>
                <span className="text-[9px] font-body-medium uppercase" style={{ color: '#6b7280' }}>Dark</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded-md text-[10px] font-body-semibold text-white"
                    style={{ backgroundImage: `linear-gradient(to right, ${scale['400']}, ${scale['600']})` }}
                  >
                    {t("customPalette.previewButton")}
                  </button>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-body-medium"
                    style={{ backgroundColor: `rgb(${accentRgb} / 0.15)`, color: scale['300'] }}
                  >
                    Badge
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-body-medium" style={{ color: scale['400'] }}>
                    {t("customPalette.previewLink")}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-body-medium"
                    style={{ backgroundColor: `rgb(${accentRgb} / 0.12)`, color: scale['400'] }}
                  >
                    {t("customPalette.previewActive")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 mt-2 flex justify-end gap-2">
          <Button size="sm" color="light" onClick={onClose}>
            {t("customPalette.cancel")}
          </Button>
          <Button size="sm" color="primary" onClick={() => onApply(color)}>
            {t("customPalette.apply")}
          </Button>
        </div>
      </div>
    </div>
  );
}
