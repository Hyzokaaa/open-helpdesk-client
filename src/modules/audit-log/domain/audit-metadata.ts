/**
 * Audit metadata values come as the backend stored them. Newer entries are flat (strings, numbers,
 * booleans), older ones may hold objects or arrays, which must never show as "[object Object]".
 */

/** Whether a value is an object or array, shown as indented JSON rather than on one line. */
export function isStructuredValue(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

/** A value on one line: primitives as they are, absent as "—", objects and arrays as compact JSON. */
export function formatInlineValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (isStructuredValue(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }
  return String(value);
}

/** A value for the detail view: objects and arrays indented over several lines, the rest inline. */
export function formatDetailValue(value: unknown): string {
  if (isStructuredValue(value)) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "—";
    }
  }
  return formatInlineValue(value);
}
