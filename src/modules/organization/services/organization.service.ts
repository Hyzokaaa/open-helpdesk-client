import { http } from "@modules/app/modules/http/domain/http";

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  domains: string[];
  logo: string | null;
}

export async function listOrganizations(
  workspaceSlug: string,
): Promise<Organization[]> {
  const res = await http.get<Organization[]>(
    `/workspaces/${workspaceSlug}/organizations`,
  );
  return res.data;
}

export async function getOrganization(
  workspaceSlug: string,
  organizationId: string,
): Promise<Organization> {
  const res = await http.get<Organization>(
    `/workspaces/${workspaceSlug}/organizations/${organizationId}`,
  );
  return res.data;
}

export async function createOrganization(
  workspaceSlug: string,
  data: { name: string; description?: string; domains?: string[] },
): Promise<Organization> {
  const res = await http.post<Organization>(
    `/workspaces/${workspaceSlug}/organizations`,
    data,
  );
  return res.data;
}

export async function updateOrganization(
  workspaceSlug: string,
  organizationId: string,
  data: { name?: string; description?: string | null; domains?: string[] },
): Promise<Organization> {
  const res = await http.patch<Organization>(
    `/workspaces/${workspaceSlug}/organizations/${organizationId}`,
    data,
  );
  return res.data;
}

export async function deleteOrganization(
  workspaceSlug: string,
  organizationId: string,
): Promise<void> {
  await http.delete(
    `/workspaces/${workspaceSlug}/organizations/${organizationId}`,
  );
}

export async function uploadOrganizationLogo(
  workspaceSlug: string,
  organizationId: string,
  file: File,
): Promise<{ logo: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await http.post<{ logo: string }>(
    `/workspaces/${workspaceSlug}/organizations/${organizationId}/logo`,
    form,
  );
  return res.data;
}

export interface OrganizationMember {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function listOrganizationMembers(
  workspaceSlug: string,
  organizationId: string,
): Promise<OrganizationMember[]> {
  const res = await http.get<OrganizationMember[]>(
    `/workspaces/${workspaceSlug}/organizations/${organizationId}/members`,
  );
  return res.data;
}

export async function addOrganizationMember(
  workspaceSlug: string,
  organizationId: string,
  userId: string,
): Promise<void> {
  await http.post(
    `/workspaces/${workspaceSlug}/organizations/${organizationId}/members`,
    { userId },
  );
}

export async function removeOrganizationMember(
  workspaceSlug: string,
  organizationId: string,
  userId: string,
): Promise<void> {
  await http.delete(
    `/workspaces/${workspaceSlug}/organizations/${organizationId}/members/${userId}`,
  );
}

export async function deleteOrganizationLogo(
  workspaceSlug: string,
  organizationId: string,
): Promise<void> {
  await http.delete(
    `/workspaces/${workspaceSlug}/organizations/${organizationId}/logo`,
  );
}
