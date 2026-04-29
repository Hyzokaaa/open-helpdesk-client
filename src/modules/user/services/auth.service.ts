import { http } from "@modules/app/modules/http/domain/http";
import { AuthUser } from "../domain/auth-user";

interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  workspaceName?: string;
}

interface SignupResponse {
  accessToken: string;
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
}

interface LoginResponse {
  accessToken: string;
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
}

export async function updateName(firstName: string, lastName: string): Promise<void> {
  await http.patch("/users/me/name", { firstName, lastName });
}

export async function updateLanguage(language: string): Promise<void> {
  await http.patch("/users/me/language", { language });
}

export async function updateTheme(theme: string): Promise<void> {
  await http.patch("/users/me/theme", { theme });
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

export async function signup(data: SignupRequest): Promise<SignupResponse> {
  const res = await http.post<SignupResponse>("/auth/signup", data);
  return res.data;
}

export async function verifyEmail(token: string): Promise<void> {
  await http.post("/auth/verify-email", { token });
}

export async function resendVerification(): Promise<void> {
  await http.post("/auth/resend-verification");
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>("/auth/login", data);
  return res.data;
}

export async function getProfile(): Promise<AuthUser> {
  const res = await http.get<ProfileResponse>("/users/me");
  return res.data;
}
