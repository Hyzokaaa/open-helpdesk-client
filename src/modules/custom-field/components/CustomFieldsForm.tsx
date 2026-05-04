import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import { CustomFieldDefinition } from "../domain/custom-field-types";
import CustomFieldRenderer from "./CustomFieldRenderer";

interface Props {
  definitions: CustomFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  disabled?: boolean;
}

export default function CustomFieldsForm({
  definitions,
  values,
  onChange,
  disabled,
}: Props) {
  if (definitions.length === 0) return null;

  return (
    <>
      {definitions.map((def) => (
        <FormInput
          key={def.id}
          label={def.name}
          required={def.required}
        >
          <CustomFieldRenderer
            definition={def}
            value={values[def.id]}
            onChange={(v) => onChange({ ...values, [def.id]: v })}
            disabled={disabled}
          />
        </FormInput>
      ))}
    </>
  );
}
