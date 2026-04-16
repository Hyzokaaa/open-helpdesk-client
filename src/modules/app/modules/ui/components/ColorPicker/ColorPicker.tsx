import clsx from "clsx";

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#64748b", "#1e293b",
];

interface Props {
  value: string | null;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={clsx(
            "w-6 h-6 rounded-full cursor-pointer transition-all",
            value === color
              ? "ring-2 ring-offset-2 ring-primary scale-110"
              : "hover:scale-110",
          )}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
