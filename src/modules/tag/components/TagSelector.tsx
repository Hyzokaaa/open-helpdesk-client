import clsx from "clsx";
import { Tag } from "../services/tag.service";

interface Props {
  tags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export default function TagSelector({
  tags,
  selectedIds,
  onChange,
  disabled = false,
}: Props) {
  const toggle = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((t) => t !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const selected = selectedIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(tag.id)}
            className={clsx(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body-medium transition-all",
              selected
                ? "ring-2 ring-offset-1 ring-primary text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300",
              disabled ? "opacity-50" : "cursor-pointer",
            )}
            style={
              selected
                ? { backgroundColor: tag.color || "#6366f1" }
                : undefined
            }
          >
            {tag.color && !selected && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
            )}
            {tag.name}
          </button>
        );
      })}
      {tags.length === 0 && (
        <span className="text-xs text-gray-400">No tags available</span>
      )}
    </div>
  );
}
