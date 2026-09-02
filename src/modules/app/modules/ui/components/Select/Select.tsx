import clsx from "clsx";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { inputClass } from "../../shared/domain/input-class";
import { Size } from "../../domain/size";
import { useFormInputId } from "../FormInput/form-input-context";

interface Props<T> {
  options: T[];
  label: (d: T) => string;
  value: (d: T) => boolean;
  onChange?: (v: T) => void;
  placeholder?: string;
  size?: Size;
  disabled?: boolean;
  searchable?: boolean;
}

export default function Select<T>({
  options,
  label,
  value: isSelected,
  onChange,
  placeholder = "Select...",
  size = "sm",
  disabled = false,
  searchable,
}: Props<T>) {
  const formId = useFormInputId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selected = options.find((o) => isSelected(o));
  const showSearch = searchable ?? options.length > 5;

  const filtered = search
    ? options.filter((o) => label(o).toLowerCase().includes(search.toLowerCase()))
    : options;

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    setSearch("");

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current?.contains(target) ||
        dropRef.current?.contains(target)
      ) return;
      setOpen(false);
    };
    const handleScroll = (e: Event) => {
      if (dropRef.current?.contains(e.target as Node)) return;
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        setOpen(false);
        return;
      }
      updatePosition();
    };

    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open && showSearch) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open, showSearch]);

  return (
    <div className="relative w-full">
      <button
        id={formId}
        ref={btnRef}
        type="button"
        disabled={disabled}
        className={clsx(
          inputClass({ size, full: true, disabled }),
          "text-left cursor-pointer flex items-center justify-between",
        )}
        onClick={() => setOpen(!open)}
      >
        <span className={selected ? "text-body" : "text-subtle"}>
          {selected ? label(selected) : placeholder}
        </span>
        <span className="text-subtle text-xs ml-2">▼</span>
      </button>

      {open && createPortal(
        <div
          ref={dropRef}
          className="fixed z-[9999] bg-surface border border-border-input rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          {showSearch && (
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 text-sm border-b border-border-input bg-surface text-body outline-none"
            />
          )}
          <div className="overflow-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted">No results</p>
            ) : (
              filtered.map((option, i) => (
                <button
                  key={i}
                  type="button"
                  className={clsx(
                    "w-full text-left px-3 py-2 text-sm hover:bg-surface-active transition-colors cursor-pointer text-body",
                    { "bg-surface-active text-primary": isSelected(option) },
                  )}
                  onClick={() => {
                    onChange?.(option);
                    setOpen(false);
                  }}
                >
                  {label(option)}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
