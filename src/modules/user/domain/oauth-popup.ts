/** What the OAuth callback popup posts to the page that opened it, once the session is saved. */
const OAUTH_SUCCESS = "oauth:success";

export interface OAuthSuccess {
  /** The provider, only when the sign-in created the account. */
  signupMethod: string | null;
}

export function oauthSuccessMessage(signupMethod?: string) {
  return { type: OAUTH_SUCCESS, signupMethod: signupMethod ?? null };
}

/** The success message, or null for anything else posted to the window. */
export function readOAuthSuccess(data: unknown): OAuthSuccess | null {
  if (typeof data !== "object" || data === null || (data as { type?: unknown }).type !== OAUTH_SUCCESS) return null;
  const method = (data as { signupMethod?: unknown }).signupMethod;
  return { signupMethod: typeof method === "string" ? method : null };
}
