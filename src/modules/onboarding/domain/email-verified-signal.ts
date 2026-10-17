/**
 * Tells the other tabs of this browser that the email was just verified, so a tab waiting on
 * "verify your email" moves on at once instead of at its next check. Browsers without
 * BroadcastChannel keep the periodic check.
 */
const CHANNEL = "open-helpdesk-auth";
const EMAIL_VERIFIED = "email-verified";

export function announceEmailVerified(): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage(EMAIL_VERIFIED);
  channel.close();
}

/** Calls back when another tab verifies the email; returns the unsubscribe. */
export function onEmailVerified(callback: () => void): () => void {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (event) => {
    if (event.data === EMAIL_VERIFIED) callback();
  };
  return () => channel.close();
}
