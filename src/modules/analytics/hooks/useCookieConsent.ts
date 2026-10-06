import { useSyncExternalStore } from "react";
import { needsCookieConsent } from "../domain/analytics-config";
import { getCookieConsentState, subscribeCookieConsent } from "../domain/cookie-consent";
import useAnalyticsScope from "./useAnalyticsScope";

/**
 * Whether the current page asks for cookie consent (any tracker measuring it uses cookies),
 * who measures it, and the visitor's current answer.
 */
export default function useCookieConsent() {
  const scope = useAnalyticsScope();
  const state = useSyncExternalStore(subscribeCookieConsent, getCookieConsentState, getCookieConsentState);
  const workspace = scope.workspace?.analytics ? scope.workspace : null;
  return {
    applies: needsCookieConsent(scope.installation) || needsCookieConsent(workspace?.analytics ?? null),
    /** The installation measures this page. */
    installation: !!scope.installation,
    /** The workspace that measures this page with its own tracker, if any. */
    workspace,
    ...state,
  };
}
