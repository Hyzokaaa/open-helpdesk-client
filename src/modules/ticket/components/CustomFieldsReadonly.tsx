import type { CustomFieldDefinition } from "@modules/custom-field/domain/custom-field-types";

interface CustomFieldsReadonlyProps {
  definitions: CustomFieldDefinition[];
  values: Record<string, unknown>;
}

export default function CustomFieldsReadonly({
  definitions,
  values,
}: CustomFieldsReadonlyProps) {
  return (
    <>
      {definitions.map((def) => {
        const val = values[def.id];
        if (val === undefined || val === null || val === "") return null;
        return (
          <div key={def.id} className="flex justify-between text-xs mb-1.5 last:mb-0">
            <span className="text-muted">{def.name}</span>
            <span className="text-body font-body-medium text-right max-w-[60%]">
              {Array.isArray(val) ? val.join(", ") : typeof val === "boolean" ? (val ? "Yes" : "No") : String(val)}
            </span>
          </div>
        );
      })}
    </>
  );
}
