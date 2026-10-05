import clsx from "clsx";
import CopyButton from "./CopyButton";

interface Tab {
  id: string;
  label: string;
}

interface Props {
  code: string;
  /** Small caption on the left of the bar ("JSON", "Node.js"). */
  label?: string;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  className?: string;
}

/** Dark code panel with a copy button, optionally with language tabs. Same look in both themes. */
export default function CodeBlock({ code, label, tabs, activeTab, onTabChange, className }: Props) {
  return (
    <div className={clsx("rounded-lg overflow-hidden border border-slate-800 bg-slate-950 text-slate-100", className)}>
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-white/10 bg-slate-900">
        <div className="flex items-center gap-1 min-w-0 overflow-x-auto">
          {tabs ? (
            tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                className={clsx(
                  "px-2 py-0.5 rounded text-xs font-body-medium transition-colors cursor-pointer whitespace-nowrap",
                  tab.id === activeTab ? "bg-white/10 text-white" : "text-slate-400 hover:text-white",
                )}
              >
                {tab.label}
              </button>
            ))
          ) : (
            <span className="text-xs text-slate-400 font-body-medium">{label}</span>
          )}
        </div>
        <CopyButton text={code} />
      </div>
      <pre className="p-3 text-xs leading-relaxed overflow-x-auto font-mono whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
