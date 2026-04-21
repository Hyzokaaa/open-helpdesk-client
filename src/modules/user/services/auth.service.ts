import { http } from "@modules/app/modules/http/domain/http";
import { AuthUser } from "../domain/auth-user";

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface RegisterResponse {
  id: string;
  email: string;
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

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const res = await http.post<RegisterResponse>("/auth/register", data);
  return res.data;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>("/auth/login", data);
  return res.data;
}

export async function getProfile(): Promise<AuthUser> {
  const res = await http.get<ProfileResponse>("/users/me");
  return res.data;
}
