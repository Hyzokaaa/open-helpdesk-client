import type { ReactNode } from "react";
import clsx from "clsx";

/** Typography for the guides and the reference, built on the app's theme tokens. */

export function H1({ children }: { children: ReactNode }) {
  return <h1 className="text-2xl md:text-3xl font-body-bold text-heading mb-3">{children}</h1>;
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-lg font-body-bold text-heading mt-10 mb-3 scroll-mt-20">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-body-bold text-heading mt-6 mb-2 uppercase tracking-wide">{children}</h3>;
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx("text-sm text-body leading-relaxed mb-3", className)}>{children}</p>;
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="text-base text-secondary-text leading-relaxed mb-6">{children}</p>;
}

export function C({ children }: { children: ReactNode }) {
  return (
    <code className="px-1 py-px rounded bg-surface-hover border border-border-card text-[0.85em] font-mono text-heading break-words">
      {children}
    </code>
  );
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1.5 text-sm text-body leading-relaxed mb-4">{children}</ul>;
}

export function OL({ children }: { children: ReactNode }) {
  return <ol className="list-decimal pl-5 space-y-1.5 text-sm text-body leading-relaxed mb-4">{children}</ol>;
}

export function Note({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" }) {
  return (
    <div
      className={clsx(
        "rounded-lg border px-4 py-3 text-sm leading-relaxed mb-4",
        tone === "info" ? "border-primary/25 bg-primary/5 text-body" : "border-amber-500/30 bg-amber-500/10 text-body",
      )}
    >
      {children}
    </div>
  );
}

export function Table({ head, rows }: { head: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto mb-4 rounded-lg border border-border-card">
      <table className="w-full text-sm">
        <thead className="bg-surface-hover">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="text-left px-3 py-2 text-xs font-body-semibold text-secondary-text whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border-row align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-body">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
