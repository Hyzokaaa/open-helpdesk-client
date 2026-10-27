import { http } from "@modules/app/modules/http/domain/http";
import { AuthUser } from "../domain/auth-user";
import { trackEvent } from "@modules/analytics/domain/analytics";
import { forgetSignupSource, keptSignupSource } from "../domain/signup-source";

interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  workspaceName?: string;
  invitationToken?: string;
}

interface SignupResponse {
  accessToken: string;
  /** Absent when the account came from a signup flow that does not open a session. */
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
  };
}

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

interface ProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isSystemAdmin: boolean;
  isEmailVerified: boolean;
  language: string;
  theme: string;
  dateFormat: string;
  timezone: string;
  avatarUrl: string | null;
  capabilities: {
    createWorkspace: boolean;
  };
}

/** Returns the name as the server stored it: markup and invisible characters are removed there. */
export async function updateName(firstName: string, lastName: string): Promise<{ firstName: string; lastName: string }> {
  const res = await http.patch<{ firstName: string; lastName: string }>("/users/me/name", { firstName, lastName });
  return { firstName: res.data.firstName, lastName: res.data.lastName };
}

export async function updateLanguage(language: string): Promise<void> {
  await http.patch("/users/me/language", { language });
}

export async function updateTheme(theme: string): Promise<void> {
  await http.patch("/users/me/theme", { theme });
}

export async function updateDateFormat(dateFormat: string): Promise<void> {
  await http.patch("/users/me/date-format", { dateFormat });
}

export async function updateTimezone(timezone: string): Promise<void> {
  await http.patch("/users/me/timezone", { timezone });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await http.patch("/users/me/password", { currentPassword, newPassword });
}

export async function forgotPassword(email: string): Promise<void> {
  await http.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await http.post("/auth/reset-password", { token, newPassword });
}

/** Sends where the person came from with the new account, and forgets it once the account exists. */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  const res = await http.post<SignupResponse>("/auth/signup", { ...data, signupSource: keptSignupSource() ?? undefined });
  forgetSignupSource();
  trackEvent("signup-completed");
  return res.data;
}

export async function verifyEmail(token: string): Promise<void> {
  await http.post("/auth/verify-email", { token });
  trackEvent("email-verified");
}

export async function resendVerification(): Promise<void> {
  await http.post("/auth/resend-verification");
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>("/auth/login", data);
  return res.data;
}

export async function exchangeOAuthCode(code: string, rememberMe: boolean): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>("/auth/oauth/exchange", { code, rememberMe });
  return res.data;
}

/** Ends the session on the server. Best effort: signing out locally must never wait on it. */
export async function logout(refreshToken: string): Promise<void> {
  await http.post("/auth/logout", { refreshToken }, { headers: { "X-Silent-Errors": "true" } });
}

// Session handoff between addresses of the installation (see domain/session-handoff.ts).
// Silent: a failed trip falls back to the sign-in page, never to an error toast.
const SILENT = { headers: { "X-Silent-Errors": "true" } };

/**
 * On the installation's address: a code for `audience` from the session kept here, or
 * `loginRequired` when there is none. Fails when `audience` is not an address of the installation.
 */
export async function startHandoff(audience: string, codeChallenge: string, refreshToken: string | null): Promise<{ code: string } | { loginRequired: true }> {
  const res = await http.post<{ code: string } | { loginRequired: true }>("/auth/handoff/start", { audience, codeChallenge, refreshToken: refreshToken ?? undefined }, SILENT);
  return res.data;
}

/** A single-use code that carries this session to `audience`, tradeable only with the receiver's secret. */
export async function issueHandoffCode(audience: string, codeChallenge: string): Promise<string> {
  const res = await http.post<{ code: string }>("/auth/handoff/codes", { audience, codeChallenge }, SILENT);
  return res.data.code;
}

export async function exchangeHandoffCode(code: string, codeVerifier: string): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>("/auth/handoff/exchange", { code, codeVerifier }, SILENT);
  return res.data;
}

export async function getProfile(): Promise<AuthUser> {
  const res = await http.get<ProfileResponse>("/users/me");
  return res.data;
}

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await http.post<{ avatarUrl: string }>("/users/me/avatar", formData);
  return res.data;
}

export async function deleteAvatar(): Promise<void> {
  await http.delete("/users/me/avatar");
}

export interface AuthProviders {
  google: boolean;
}

export async function getAuthProviders(): Promise<AuthProviders> {
  try {
    const res = await http.get<AuthProviders>("/auth/providers");
    return res.data;
  } catch {
    return { google: false };
  }
}
