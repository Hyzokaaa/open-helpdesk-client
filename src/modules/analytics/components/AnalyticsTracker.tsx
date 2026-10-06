import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";
import { setAnalyticsContext, setWorkspaceAnalyticsLoader, startAnalytics, trackPage } from "../domain/analytics";
import { privacyWorkspaceSlug, workspaceSlugFor } from "../domain/workspace-context";
import { loadWorkspaceAnalytics } from "../services/workspace-analytics.service";

/**
 * Waits this long for the location to settle before reporting it, so a route that immediately
 * redirects (`/dashboard/settings` → `/account`, unknown paths → `/login`) is reported once, as
 * its destination. React StrictMode's mount/unmount/mount clears the first timer the same way.
 */
const SETTLE_MS = 300;

const PRIVACY_PATH = "/privacy";

/**
 * Reports page views as route patterns, to the installation's tracker and to the current
 * workspace's own. Mounted once inside the router; renders nothing. Only the pathname is read:
 * query string and hash never reach analytics.
 *
 * The workspace context is set as soon as the pathname changes (not after it settles), so a
 * product event fired on a page is routed by that page's workspace.
 */
export default function AnalyticsTracker() {
  const { analytics, loading, domainWorkspaces } = useConfig();
  const { pathname } = useLocation();
  const lastWorkspace = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    setWorkspaceAnalyticsLoader((slug) => loadWorkspaceAnalytics(slug, domainWorkspaces));
    startAnalytics(analytics);
  }, [loading, analytics, domainWorkspaces]);

  useEffect(() => {
    if (loading) return;
    const slug = workspaceSlugFor(pathname, domainWorkspaces);
    if (slug) lastWorkspace.current = slug;
    // The privacy policy is outside every workspace, but speaks for the one the visitor came from.
    const scopeSlug = pathname === PRIVACY_PATH ? privacyWorkspaceSlug(lastWorkspace.current, domainWorkspaces) : slug;
    setAnalyticsContext(slug, scopeSlug);

    const timer = window.setTimeout(() => trackPage(pathname), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [loading, pathname, domainWorkspaces]);

  return null;
}
