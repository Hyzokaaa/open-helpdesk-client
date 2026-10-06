import { useSyncExternalStore } from "react";
import { getAnalyticsScope, subscribeAnalyticsScope } from "../domain/analytics";

/** What measures the current page: the installation, the workspace's own tracker, both or neither. */
export default function useAnalyticsScope() {
  return useSyncExternalStore(subscribeAnalyticsScope, getAnalyticsScope, getAnalyticsScope);
}
