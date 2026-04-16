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
