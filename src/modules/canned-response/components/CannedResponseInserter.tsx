import clsx from "clsx";
import { CannedResponse } from "../services/canned-response.service";

interface Props {
  responses: CannedResponse[];
  search: string;
  selectedIndex: number;
  onSelect: (response: CannedResponse) => void;
}

export default function CannedResponseInserter({
  responses,
  search,
  selectedIndex,
  onSelect,
}: Props) {
  const filtered = responses.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()),
  );

  if (filtered.length === 0) return null;

  return (
    <div className="absolute bottom-full mb-1 left-0 bg-surface border border-border-input rounded-lg shadow-lg w-80 max-h-48 overflow-auto z-50">
      {filtered.map((r, i) => (
        <button
          key={r.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(r);
          }}
          className={clsx(
            "w-full text-left px-3 py-2 cursor-pointer",
            i === selectedIndex
              ? "bg-surface-active text-primary"
              : "text-body hover:bg-surface-hover",
          )}
        >
          <span className="text-sm font-body-semibold block">{r.title}</span>
          <span className="text-xs text-subtle block truncate">{r.content}</span>
        </button>
      ))}
    </div>
  );
}
