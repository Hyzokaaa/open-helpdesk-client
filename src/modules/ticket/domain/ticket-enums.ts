export const PRIORITIES = ["low", "medium", "high", "critical"] as const;
export const STATUSES = ["open", "pending", "in-progress", "resolved", "discarded"] as const;
export const PRIORITY_COLORS: Record<string, "gray" | "blue" | "yellow" | "red"> = {
  low: "gray",
  medium: "blue",
  high: "yellow",
  critical: "red",
};

export const STATUS_COLORS: Record<string, "gray" | "blue" | "green" | "primary" | "red" | "yellow"> = {
  open: "yellow",
  pending: "gray",
  "in-progress": "blue",
  resolved: "green",
  discarded: "red",
};

