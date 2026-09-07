import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import useTranslation from "@modules/app/i18n/useTranslation";

export interface FilterSection {
  key: string;
  label: string;
  type: "multi" | "single";
  options: { value: string; label: string }[];
  /** For multi: values deselected by default */
  defaultExcluded?: string[];
}

export interface FilterState {
  [sectionKey: string]: {
    type: "multi";
    excluded: string[];
  } | {
    type: "single";
    value: string | undefined;
  };
}

interface Props {
  sections: FilterSection[];
  state: FilterState;
  onChange: (state: FilterState) => void;
}

export function buildInitialState(sections: FilterSection[]): FilterState {
  const state: FilterState = {};
  for (const s of sections) {
    if (s.type === "multi") {
      state[s.key] = { type: "multi", excluded: s.defaultExcluded ?? [] };
    } else {
      state[s.key] = { type: "single", value: undefined };
    }
  }
  return state;
}

export function getActiveFilterCount(state: FilterState): number {
  let count = 0;
  for (const val of Object.values(state)) {
    if (val.type === "multi" && val.excluded.length > 0) count += val.excluded.length;
    if (val.type === "single" && val.value) count++;
  }
  return count;
}

export function getFilterChips(sections: FilterSection[], state: FilterState): { key: string; section: string; label: string; value: string }[] {
  const chips: { key: string; section: string; label: string; value: string }[] = [];
  for (const s of sections) {
    const val = state[s.key];
    if (!val) continue;
    if (val.type === "multi") {
      for (const ex of val.excluded) {
        const opt = s.options.find(o => o.value === ex);
        chips.push({ key: `${s.key}:${ex}`, section: s.label, label: opt?.label ?? ex, value: ex });
      }
    } else if (val.type === "single" && val.value) {
      const opt = s.options.find(o => o.value === val.value);
      chips.push({ key: s.key, section: s.label, label: opt?.label ?? val.value, value: val.value });
    }
  }
  return chips;
}

export default function FilterPopover({ sections, state, onChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeCount = getActiveFilterCount(state);

  const toggleMulti = (sectionKey: string, value: string) => {
    const section = state[sectionKey];
    if (!section || section.type !== "multi") return;
    const excluded = section.excluded.includes(value)
      ? section.excluded.filter(v => v !== value)
      : [...section.excluded, value];
    onChange({ ...state, [sectionKey]: { type: "multi", excluded } });
  };

  const setSingle = (sectionKey: string, value: string | undefined) => {
    onChange({ ...state, [sectionKey]: { type: "single", value } });
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx(
          "flex items-center gap-2 px-3 py-1.5 rounded-input border text-sm cursor-pointer transition-colors",
          activeCount > 0
            ? "bg-surface-active border-primary-300 text-primary"
            : "bg-surface border-border-input text-muted hover:text-body",
        )}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
        </svg>
        <span>{t("filters.label")}</span>
        {activeCount > 0 && (
          <span className="bg-primary-600 text-on-primary text-exs rounded-full w-4 h-4 flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 bg-surface border border-border-input rounded-lg shadow-lg w-72 max-h-[480px] overflow-y-auto">
          <div className="p-3 space-y-4">
            {sections.map((section) => {
              const val = state[section.key];
              return (
                <div key={section.key}>
                  <p className="text-exs font-body-semibold text-subtle uppercase mb-1.5">{section.label}</p>
                  {section.type === "multi" && val?.type === "multi" ? (
                    <div className="flex flex-wrap gap-1">
                      {section.options.map((opt) => {
                        const active = !val.excluded.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleMulti(section.key, opt.value)}
                            className={clsx(
                              "px-2 py-1 rounded text-exs font-body-medium transition-colors cursor-pointer whitespace-nowrap",
                              active ? "bg-primary-600 text-on-primary" : "bg-surface-hover text-muted line-through",
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : section.type === "single" && val?.type === "single" ? (
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setSingle(section.key, undefined)}
                        className={clsx(
                          "px-2 py-1 rounded text-exs font-body-medium transition-colors cursor-pointer",
                          !val.value ? "bg-primary-600 text-on-primary" : "text-muted hover:bg-surface-hover",
                        )}
                      >
                        {t("filters.all")}
                      </button>
                      {section.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSingle(section.key, opt.value)}
                          className={clsx(
                            "px-2 py-1 rounded text-exs font-body-medium transition-colors cursor-pointer whitespace-nowrap",
                            val.value === opt.value ? "bg-primary-600 text-on-primary" : "text-muted hover:bg-surface-hover",
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-active text-exs text-primary border border-primary/20">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 cursor-pointer transition-colors">✕</button>
    </span>
  );
}
