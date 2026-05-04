import Input from "@modules/app/modules/ui/components/Input/Input";
import Select from "@modules/app/modules/ui/components/Select/Select";
import { CustomFieldDefinition } from "../domain/custom-field-types";

interface Props {
  definition: CustomFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export default function CustomFieldRenderer({
  definition,
  value,
  onChange,
  disabled,
}: Props) {
  switch (definition.type) {
    case "text":
      return (
        <Input
          value={(value as string) ?? ""}
          onChange={onChange}
          disabled={disabled}
          placeholder={definition.name}
        />
      );

    case "number":
      return (
        <input
          type="number"
          className="w-full bg-surface rounded-input border-input transition-all duration-200 outline-none shadow-input text-body border-input-effect px-3 py-1 text-sm"
          value={(value as number) ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? null : Number(v));
          }}
          disabled={disabled}
          placeholder={definition.name}
        />
      );

    case "select":
      return (
        <Select
          options={definition.options ?? []}
          label={(o) => o}
          value={(o) => o === (value as string)}
          onChange={onChange}
          placeholder={definition.name}
        />
      );

    case "multi-select": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-1.5">
          {(definition.options ?? []).map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                disabled={disabled}
                onClick={() => {
                  const next = isSelected
                    ? selected.filter((s) => s !== opt)
                    : [...selected, opt];
                  onChange(next);
                }}
                className={`px-2 py-0.5 rounded text-xs font-body-medium transition-colors cursor-pointer border ${
                  isSelected
                    ? "bg-primary-600 text-on-primary border-primary-600"
                    : "bg-surface text-subtle border-border-input hover:bg-surface-hover"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );
    }

    case "date":
      return (
        <input
          type="date"
          className="w-full bg-surface rounded-input border-input transition-all duration-200 outline-none shadow-input text-body border-input-effect px-3 py-1 text-sm"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
        />
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="rounded border-border-input"
          />
          <span className="text-sm text-body">{definition.name}</span>
        </label>
      );

    default:
      return null;
  }
}
