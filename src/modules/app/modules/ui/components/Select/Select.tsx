import clsx from "clsx";
import { useState, useRef, useEffect } from "react";
import { inputClass } from "../../shared/domain/input-class";
import { Size } from "../../domain/size";

interface Props<T> {
  options: T[];
  label: (d: T) => string;
  value: (d: T) => boolean;
  onChange?: (v: T) => void;
  placeholder?: string;
  size?: Size;
  disabled?: boolean;
}

export default function Select<T>({
  options,
  label,
  value: isSelected,
  onChange,
  placeholder = "Select...",
  size = "sm",
  disabled = false,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => isSelected(o));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        className={clsx(
          inputClass({ size, full: true, disabled }),
          "text-left cursor-pointer flex items-center justify-between",
        )}
        onClick={() => setOpen(!open)}
      >
        <span className={selected ? "text-gray-700" : "text-gray-400"}>
          {selected ? label(selected) : placeholder}
        </span>
        <span className="text-gray-400 text-xs ml-2">▼</span>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          {options.map((option, i) => (
            <button
              key={i}
              type="button"
              className={clsx(
                "w-full text-left px-3 py-2 text-sm hover:bg-primary-50 transition-colors cursor-pointer",
                { "bg-primary-50 text-primary": isSelected(option) },
              )}
              onClick={() => {
                onChange?.(option);
                setOpen(false);
              }}
            >
              {label(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
