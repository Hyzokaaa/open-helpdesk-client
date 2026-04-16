export const PRIORITIES = ["low", "medium", "high", "critical"] as const;
export const STATUSES = ["pending", "in-progress", "resolved", "closed"] as const;
export const CATEGORIES = ["bug", "issue"] as const;

export const PRIORITY_COLORS: Record<string, "gray" | "blue" | "yellow" | "red"> = {
  low: "gray",
  medium: "blue",
  high: "yellow",
  critical: "red",
};

export const STATUS_COLORS: Record<string, "gray" | "blue" | "green" | "primary" | "red"> = {
  pending: "gray",
  "in-progress": "blue",
  resolved: "green",
  closed: "primary",
};

export const CATEGORY_COLORS: Record<string, "red" | "yellow"> = {
  bug: "red",
  issue: "yellow",
};
