import type { CustomFieldDefinition } from "@modules/custom-field/domain/custom-field-types";
import useTranslation from "@modules/app/i18n/useTranslation";
import useUser from "@modules/user/hooks/useUser";
import type { DateFormatOption } from "@modules/app/utils/format-date";
import { formatCustomFieldValue } from "@modules/custom-field/domain/format-custom-field-value";
import PropertyRow from "./PropertyRow";

interface CustomFieldsReadonlyProps {
  definitions: CustomFieldDefinition[];
  values: Record<string, unknown>;
}

/** The values read like Properties: name on the left, value beside it. */
export default function CustomFieldsReadonly({
  definitions,
  values,
}: CustomFieldsReadonlyProps) {
  const { t } = useTranslation();
  const { user } = useUser();
  const dateFormat = (user?.dateFormat as DateFormatOption) || "DD/MM/YYYY";

  return (
    <div className="divide-y divide-border-card/50">
      {definitions.map((def) => {
        const val = values[def.id];
        if (val === undefined || val === null || val === "") return null;
        return (
          <PropertyRow key={def.id} label={def.name}>
            <span className="text-xs text-body font-body-medium break-words">{formatCustomFieldValue(def.type, val, t as (key: string) => string, dateFormat)}</span>
          </PropertyRow>
        );
      })}
    </div>
  );
}
