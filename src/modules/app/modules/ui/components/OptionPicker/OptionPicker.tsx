import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface PickerOption<T extends string> {
  value: T;
  label: string;
  description: string;
  disabled?: boolean;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: PickerOption<T>[];
  onChange: (value: T) => void;
}

/** A choice between a few options, each with a line saying what it does. */
export default function OptionPicker<T extends string>({ label, value, options, onChange }: Props<T>) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const selected = options.find((o) => o.value === value) ?? options[0];

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handle = (e: MouseEvent) => {
      if (buttonRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", handle);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return (
    <div className="mb-4">
      <p className="text-xs font-body-semibold text-heading mb-1.5">{label}</p>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left bg-surface border border-border-card rounded px-3 py-2 cursor-pointer hover:bg-surface-hover transition-colors relative"
      >
        <span className="text-sm text-body font-body-medium">{selected.label}</span>
        <span className="text-exs text-muted block mt-0.5">{selected.description}</span>
        <svg className="absolute right-3 top-3 text-muted" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className="bg-surface border border-border-card rounded-lg shadow-lg overflow-hidden"
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-default ${
                option.value === value ? "bg-primary/5 border-l-2 border-primary" : "enabled:hover:bg-surface-hover border-l-2 border-transparent enabled:cursor-pointer"
              }`}
            >
              <span className="text-sm text-body font-body-medium">{option.label}</span>
              <span className="text-exs text-muted block mt-0.5">{option.description}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
