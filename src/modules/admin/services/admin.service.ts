import { http } from "@modules/app/modules/http/domain/http";

export interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSystemAdmin: boolean;
  isActive: boolean;
  planId?: string;
}

export async function listAllUsers(sort?: {
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}): Promise<UserItem[]> {
  const res = await http.get<UserItem[]>("/users", { params: sort });
  return res.data;
}

export async function createUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isSystemAdmin?: boolean;
  isEmailVerified?: boolean;
}): Promise<{ id: string; email: string }> {
  const res = await http.post("/users", data);
  return res.data;
}

export async function toggleSystemAdmin(
  userId: string,
  isSystemAdmin: boolean,
): Promise<void> {
  await http.patch(`/users/${userId}/system-admin`, { isSystemAdmin });
}

export async function toggleUserActive(
  userId: string,
  isActive: boolean,
): Promise<void> {
  await http.patch(`/users/${userId}/active`, { isActive });
}
