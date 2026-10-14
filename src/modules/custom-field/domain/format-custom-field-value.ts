import { formatCalendarDate, type DateFormatOption } from "@modules/app/utils/format-date";
import type { CustomFieldDefinition } from "./custom-field-types";

/**
 * A custom field's value as a person reads it: "Yes"/"No" for a checkbox, the date in their
 * order, several options joined. The same in the dashboard and the portal.
 */
export function formatCustomFieldValue(
  type: CustomFieldDefinition["type"] | string,
  value: unknown,
  t: (key: string) => string,
  dateFormat: DateFormatOption = "DD/MM/YYYY",
): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return t(value ? "common.yes" : "common.no");
  if (type === "date" && typeof value === "string") return formatCalendarDate(value, dateFormat);
  return String(value ?? "");
}
