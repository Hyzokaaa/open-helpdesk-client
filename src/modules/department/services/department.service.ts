import { http } from "@modules/app/modules/http/domain/http";

export interface Department {
  id: string;
  name: string;
  description: string;
  memberCount?: number;
}

export interface DepartmentMember {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface DepartmentDetail {
  id: string;
  name: string;
  description: string;
  members: DepartmentMember[];
}

export async function listDepartments(
  workspaceSlug: string,
): Promise<Department[]> {
  const res = await http.get<Department[]>(
    `/workspaces/${workspaceSlug}/departments`,
  );
  return res.data;
}

export async function getDepartment(
  workspaceSlug: string,
  departmentId: string,
): Promise<DepartmentDetail> {
  const res = await http.get<DepartmentDetail>(
    `/workspaces/${workspaceSlug}/departments/${departmentId}`,
  );
  return res.data;
}

export async function createDepartment(
  workspaceSlug: string,
  data: { name: string; description?: string },
): Promise<Department> {
  const res = await http.post<Department>(
    `/workspaces/${workspaceSlug}/departments`,
    data,
  );
  return res.data;
}

export async function updateDepartment(
  workspaceSlug: string,
  departmentId: string,
  data: { name?: string; description?: string },
): Promise<Department> {
  const res = await http.patch<Department>(
    `/workspaces/${workspaceSlug}/departments/${departmentId}`,
    data,
  );
  return res.data;
}

export async function deleteDepartment(
  workspaceSlug: string,
  departmentId: string,
): Promise<void> {
  await http.delete(
    `/workspaces/${workspaceSlug}/departments/${departmentId}`,
  );
}

export async function addDepartmentMember(
  workspaceSlug: string,
  departmentId: string,
  userId: string,
): Promise<void> {
  await http.post(
    `/workspaces/${workspaceSlug}/departments/${departmentId}/members`,
    { userId },
  );
}

export async function removeDepartmentMember(
  workspaceSlug: string,
  departmentId: string,
  userId: string,
): Promise<void> {
  await http.delete(
    `/workspaces/${workspaceSlug}/departments/${departmentId}/members/${userId}`,
  );
}
