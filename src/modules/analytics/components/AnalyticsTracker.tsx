import { useEffect } from "react";
import { useLocation } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";
import { startAnalytics, trackPage } from "../domain/analytics";

/**
 * Waits this long for the location to settle before reporting it, so a route that immediately
 * redirects (`/dashboard/settings` → `/account`, unknown paths → `/login`) is reported once, as
 * its destination. React StrictMode's mount/unmount/mount clears the first timer the same way.
 */
const SETTLE_MS = 300;

/**
 * Reports page views as route patterns. Mounted once inside the router; renders nothing and
 * does nothing when the installation has analytics off. Only the pathname is read: query
 * string and hash never reach analytics.
 */
export default function AnalyticsTracker() {
  const { analytics } = useConfig();
  const { pathname } = useLocation();

  useEffect(() => {
    if (analytics) startAnalytics(analytics);
  }, [analytics]);

  useEffect(() => {
    if (!analytics) return;
    const timer = window.setTimeout(() => trackPage(pathname), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [analytics, pathname]);

  return null;
}
