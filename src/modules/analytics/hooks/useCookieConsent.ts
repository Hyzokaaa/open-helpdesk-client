import { useSyncExternalStore } from "react";
import useConfig from "@modules/app/hooks/useConfig";
import { needsCookieConsent } from "../domain/analytics-config";
import { getCookieConsentState, subscribeCookieConsent } from "../domain/cookie-consent";

/** Whether this installation asks for cookie consent, and the visitor's current answer. */
export default function useCookieConsent() {
  const { analytics } = useConfig();
  const state = useSyncExternalStore(subscribeCookieConsent, getCookieConsentState, getCookieConsentState);
  return { applies: needsCookieConsent(analytics), ...state };
}
