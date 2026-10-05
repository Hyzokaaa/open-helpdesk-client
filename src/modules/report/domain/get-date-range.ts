import { subDays, startOfDay, endOfDay } from "date-fns";

/**
 * Report range for a preset, as ISO instants: local start of the first day to local
 * end of today, converted to UTC so the backend sees the same moments the user means.
 */
export function getDateRange(preset: string, now: Date = new Date()) {
  if (preset === "all") return { dateFrom: "", dateTo: "" };
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  return {
    dateFrom: startOfDay(subDays(now, days)).toISOString(),
    dateTo: endOfDay(now).toISOString(),
  };
}
