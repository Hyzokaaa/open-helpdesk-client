/**
 * Product events the client reports, fired after the action succeeded. This list is the whole
 * vocabulary: names are kebab-case and props are short enum-like values, never user content,
 * names, emails, ids or search terms.
 */
export const ANALYTICS_EVENTS = [
  "signup-completed",
  "email-verified",
  "workspace-created",
  "member-invited",
  "invitation-accepted",
  "ticket-created",
  "comment-created",
  "ticket-status-changed",
  "ticket-assigned",
  "kb-article-published",
  "workspace-exported",
  "workspace-imported",
  "api-key-created",
  "webhook-created",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/** Props per event; an event not listed here takes none. */
export interface AnalyticsEventProps {
  "member-invited": { role: string };
  "ticket-created": { channel: "dashboard" | "portal" };
  "comment-created": { visibility: "public" | "internal" };
  "ticket-status-changed": { status: string };
}

export type AnalyticsEventArgs<E extends AnalyticsEventName> = E extends keyof AnalyticsEventProps
  ? [props: AnalyticsEventProps[E]]
  : [];

/** Enum-like values only: anything longer or with other characters is dropped, not sent. */
const SAFE_VALUE = /^[a-z0-9][a-z0-9_-]{0,31}$/i;
const SAFE_KEY = /^[a-z][a-zA-Z0-9]{0,31}$/;

/** Props as Matomo's event name: `key=value` pairs joined with `;`, unsafe pairs left out. */
export function serializeEventProps(props: Record<string, string> | undefined): string | undefined {
  if (!props) return undefined;
  const pairs = Object.entries(props)
    .filter(([key, value]) => SAFE_KEY.test(key) && typeof value === "string" && SAFE_VALUE.test(value))
    .map(([key, value]) => `${key}=${value.toLowerCase()}`);
  return pairs.length > 0 ? pairs.join(";") : undefined;
}
