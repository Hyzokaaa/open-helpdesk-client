import { LOCAL_STORAGE_KEY, LocalStorage } from "@modules/app/domain/core/local-storage";
import { saveSession } from "@modules/app/domain/core/session";
import translations from "@modules/app/i18n/translations";
import { exchangeHandoffCode, issueHandoffCode, startHandoff } from "../services/auth.service";
import { callbackUrl, goStoreOnInstallation, HandoffFailure, handoffFailure, offerToStore, readReceiveCallback, safeRedirect, signInPathFor, takeStoreOffer } from "./session-handoff";

/**
 * The trips of the session handoff (see session-handoff.ts), handled before the app mounts: the
 * pages in between only trade codes, so they skip everything the app loads on start (profile,
 * config, branding, analytics). True when the page is leaving and the app must not render.
 */
export async function runSessionHandoffBeforeApp(): Promise<boolean> {
  switch (window.location.pathname) {
    case "/auth/handoff":
      return answerOnInstallation();
    case "/auth/handoff/store":
      return storeOnInstallation();
    case "/auth/handoff/callback":
      return receiveOnCustomDomain();
    default:
      return false;
  }
}

/** On the installation: one call gives the code for the custom domain, or tells it to sign in. */
async function answerOnInstallation(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("return");
  const challenge = params.get("challenge");
  const state = params.get("state");
  if (!returnTo || !challenge || !state) return refuse();
  if (params.get("want") === "store") return offerAfterSignIn(returnTo, challenge, state);

  // Only a session kept signed in travels; the server checks it too
  const refreshToken = LocalStorage.get(LOCAL_STORAGE_KEY.SESSION_REMEMBER) !== "0"
    ? LocalStorage.get(LOCAL_STORAGE_KEY.REFRESH_TOKEN)
    : null;
  let answer: Awaited<ReturnType<typeof startHandoff>>;
  try {
    answer = await startHandoff(returnTo, challenge, refreshToken);
  } catch (error) {
    // Not an address of the installation, or no answer at all: nobody is sent there
    return refuse(handoffFailure(error));
  }

  if ("code" in answer) {
    window.location.replace(callbackUrl(returnTo, { code: answer.code, state }));
    return true;
  }
  const offer = await offerToStore(returnTo);
  window.location.replace(callbackUrl(returnTo, {
    error: "login_required",
    state,
    hubChallenge: offer.challenge,
    hubState: offer.state,
  }));
  return true;
}

/**
 * On the installation, asked by a custom domain whose user just signed in: offers to keep a copy
 * of that session, unless this address already has one (it is never replaced). The server checks
 * first that the domain belongs to the installation, so nobody else gets an offer.
 */
async function offerAfterSignIn(returnTo: string, challenge: string, state: string): Promise<boolean> {
  try {
    // Without a session it only checks the address and says to sign in
    await startHandoff(returnTo, challenge, null);
  } catch (error) {
    return refuse(handoffFailure(error));
  }
  if (LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN)) {
    window.location.replace(callbackUrl(returnTo, { error: "has_session", state }));
    return true;
  }
  const offer = await offerToStore(returnTo);
  window.location.replace(callbackUrl(returnTo, { error: "login_required", state, hubChallenge: offer.challenge, hubState: offer.state }));
  return true;
}

/**
 * On the installation, right after someone signed in on a custom domain: keeps a copy of that
 * session and goes back. It only takes a session this very tab offered to receive, and never
 * replaces one it already has, so a link made by someone else cannot sign this browser in to
 * their account.
 */
async function storeOnInstallation(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const offer = takeStoreOffer(params.get("state"), params.get("return"));
  if (!offer) {
    // Not a trip this tab started: stay on this address
    window.location.replace("/dashboard");
    return true;
  }

  const code = params.get("code");
  if (code && !LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN)) {
    try {
      saveSession(await exchangeHandoffCode(code, offer.verifier), { remember: true });
    } catch {
      // Nothing kept: the next domain asks for the password, as before
    }
  }
  window.location.replace(`${offer.returnTo}${safeRedirect(params.get("redirect"))}`);
  return true;
}

/**
 * On the custom domain, back from the installation: signs in with the code before the app mounts,
 * so it starts once, already signed in, on the page that was asked for. Without a code it starts
 * on the sign-in page.
 */
async function receiveOnCustomDomain(): Promise<boolean> {
  const result = readReceiveCallback(new URLSearchParams(window.location.search));
  // The code must not stay in the address bar or the history
  window.history.replaceState(null, "", "/auth/handoff/callback");

  if (result.kind === "store") {
    // Back from fetching the installation's offer, already signed in here: send it the session.
    // Without an offer (it has one already) or if that fails, this domain just goes on
    if (result.offer) {
      try {
        const code = await issueHandoffCode(result.installation, result.offer.challenge);
        goStoreOnInstallation(result.installation, code, result.offer, result.redirect);
        return true;
      } catch {
        // Not copied: the next domain asks for the password, as before
      }
    }
    window.history.replaceState(null, "", result.redirect);
    return false;
  }

  if (result.kind === "code") {
    try {
      saveSession(await exchangeHandoffCode(result.code, result.verifier), { remember: true });
      window.history.replaceState(null, "", result.redirect);
      return false;
    } catch {
      // Expired or already used: sign in as usual
    }
  }
  if (result.kind === "login" && result.signIn) {
    window.history.replaceState(null, "", result.signIn);
    return false;
  }
  window.history.replaceState(null, "", signInPathFor(result.kind === "invalid" ? null : result.redirect));
  return false;
}

/** Says why the page goes nowhere, in the person's language; the app is not there to say it. */
function refuse(reason: HandoffFailure = "refused"): boolean {
  const lang = (LocalStorage.get(LOCAL_STORAGE_KEY.LANGUAGE) ?? navigator.language).startsWith("es") ? "es" : "en";
  const root = document.getElementById("root");
  if (root) root.textContent = translations[reason === "refused" ? "handoff.refused" : "handoff.unreachable"][lang];
  return true;
}
