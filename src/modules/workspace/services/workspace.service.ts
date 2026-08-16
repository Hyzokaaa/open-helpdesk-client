import { http } from "@modules/app/modules/http/domain/http";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  role: string;
  ownerName?: string;
  palette: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
}

export interface WorkspaceDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  palette: string | null;
  supportEmail: string | null;
  systemMailboxEnabled: boolean;
  customDomain: string | null;
  customDomainVerified: boolean;
  domainVerificationToken: string | null;
  cnameTarget: string;
  appName: string | null;
  appSubtitle: string | null;
  logo: string | null;
}

export interface DomainVerificationResult {
  verified: boolean;
  cnameValid: boolean;
  txtValid: boolean;
  cnameTarget: string;
  txtRecord: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  autoCreated: boolean;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export async function listUsers(): Promise<UserListItem[]> {
  const res = await http.get<UserListItem[]>("/users");
  return res.data;
}

export async function listWorkspaces(sort?: {
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}): Promise<Workspace[]> {
  const res = await http.get<Workspace[]>("/workspaces", { params: sort });
  return res.data;
}

export async function getWorkspace(slug: string): Promise<WorkspaceDetail> {
  const res = await http.get<WorkspaceDetail>(`/workspaces/${slug}`);
  return res.data;
}

export async function createWorkspace(data: {
  name: string;
  description: string;
}): Promise<{ id: string; name: string; slug: string; supportEmail: string | null }> {
  const res = await http.post("/workspaces", data);
  return res.data;
}

export async function listMembers(
  slug: string,
  autoCreated?: boolean,
): Promise<WorkspaceMember[]> {
  const params = autoCreated !== undefined ? `?autoCreated=${autoCreated}` : '';
  const res = await http.get<WorkspaceMember[]>(
    `/workspaces/${slug}/members${params}`,
  );
  return res.data;
}

export async function addMember(
  slug: string,
  data: { userId: string; role: string },
): Promise<WorkspaceMember> {
  const res = await http.post<WorkspaceMember>(
    `/workspaces/${slug}/members`,
    data,
  );
  return res.data;
}

export async function updateWorkspace(
  slug: string,
  data: { name?: string; description?: string },
): Promise<{ id: string; name: string; slug: string; description: string }> {
  const res = await http.patch(`/workspaces/${slug}`, data);
  return res.data;
}

export async function deleteWorkspace(slug: string): Promise<void> {
  await http.delete(`/workspaces/${slug}`);
}

export async function changeMemberRole(
  slug: string,
  userId: string,
  role: string,
): Promise<void> {
  await http.patch(`/workspaces/${slug}/members/${userId}/role`, { role });
}

export async function updateContactName(
  slug: string,
  userId: string,
  firstName: string,
  lastName: string,
): Promise<void> {
  await http.patch(`/workspaces/${slug}/members/${userId}/name`, { firstName, lastName });
}

export async function removeMember(
  slug: string,
  userId: string,
): Promise<void> {
  await http.delete(`/workspaces/${slug}/members/${userId}`);
}

export async function updateWorkspacePalette(
  slug: string,
  palette: string | null,
): Promise<void> {
  await http.patch(`/workspaces/${slug}/palette`, { palette });
}

export interface SlaPriorityTargets {
  critical: number | null;
  high: number | null;
  medium: number | null;
  low: number | null;
}

export interface SlaPolicy {
  firstResponse: SlaPriorityTargets;
  resolution: SlaPriorityTargets;
}

export async function getSlaPolicy(slug: string, options?: { silent?: boolean }): Promise<{ slaPolicy: SlaPolicy | null }> {
  const res = await http.get<{ slaPolicy: SlaPolicy | null }>(
    `/workspaces/${slug}/sla`,
    options?.silent ? { headers: { 'X-Silent-Errors': 'true' } } : undefined,
  );
  return res.data;
}

export async function updateSlaPolicy(
  slug: string,
  slaPolicy: SlaPolicy | null,
): Promise<void> {
  await http.patch(`/workspaces/${slug}/sla`, { slaPolicy });
}

// Import members

export interface ImportPreviewRow {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: "new_user" | "existing_user";
}

export interface ImportPreviewError {
  row: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  error: string;
}

export interface ImportPreviewResult {
  valid: ImportPreviewRow[];
  errors: ImportPreviewError[];
  summary: { toCreate: number; errors: number; alreadyMembers: number };
}

export interface ImportConfirmResult {
  created: number;
  added: number;
  skipped: number;
}

export async function importMembersPreview(
  slug: string,
  file: File,
): Promise<ImportPreviewResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await http.post<ImportPreviewResult>(
    `/workspaces/${slug}/members/import/preview`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function importMembersConfirm(
  slug: string,
  rows: Array<{ email: string; firstName: string; lastName: string; role: string }>,
  skipVerification = false,
): Promise<ImportConfirmResult> {
  const res = await http.post<ImportConfirmResult>(
    `/workspaces/${slug}/members/import/confirm`,
    { rows, skipVerification },
  );
  return res.data;
}

export function getImportTemplateUrl(slug: string): string {
  return `/workspaces/${slug}/members/import/template`;
}

export async function downloadImportTemplate(slug: string): Promise<void> {
  const res = await http.get(`/workspaces/${slug}/members/import/template`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = "import-members-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function toggleSystemMailbox(slug: string, enabled: boolean): Promise<{ systemMailboxEnabled: boolean }> {
  const res = await http.patch<{ systemMailboxEnabled: boolean }>(`/workspaces/${slug}/system-mailbox`, { enabled });
  return res.data;
}

export async function exportWorkspace(slug: string): Promise<Blob> {
  const res = await http.get(`/workspaces/${slug}/export`, { responseType: 'blob' });
  return res.data;
}

export interface ImportResult {
  usersCreated: number;
  membersAdded: number;
  tagsImported: number;
  ticketsImported: number;
  commentsImported: number;
  attachmentsImported: number;
  participantsImported: number;
  cannedResponsesImported: number;
  customFieldsImported: number;
  csatResponsesImported: number;
  auditLogImported: number;
}

export async function importWorkspace(slug: string, data: any): Promise<ImportResult> {
  const res = await http.post<ImportResult>(`/workspaces/${slug}/import`, data);
  return res.data;
}

export async function importWorkspaceFromUrl(slug: string, url: string): Promise<ImportResult> {
  const res = await http.post<ImportResult>(`/workspaces/${slug}/import`, { url });
  return res.data;
}

export async function createExportToken(slug: string): Promise<{ url: string; expiresAt: string }> {
  const res = await http.post<{ url: string; expiresAt: string }>(`/workspaces/${slug}/export/token`);
  return res.data;
}

export async function setCustomDomain(slug: string, domain: string | null, autoVerify?: boolean): Promise<{ customDomain: string | null; customDomainVerified: boolean; domainVerificationToken: string | null; cnameTarget: string }> {
  const res = await http.patch<{ customDomain: string | null; customDomainVerified: boolean; domainVerificationToken: string | null; cnameTarget: string }>(`/workspaces/${slug}/custom-domain`, { domain, autoVerify });
  return res.data;
}

export async function verifyCustomDomain(slug: string): Promise<DomainVerificationResult> {
  const res = await http.post<DomainVerificationResult>(`/workspaces/${slug}/custom-domain/verify`);
  return res.data;
}

export async function setBranding(slug: string, data: { appName?: string | null; appSubtitle?: string | null }): Promise<{ appName: string | null; appSubtitle: string | null }> {
  const res = await http.patch<{ appName: string | null; appSubtitle: string | null }>(`/workspaces/${slug}/branding`, data);
  return res.data;
}

export async function uploadLogo(slug: string, file: File): Promise<{ logo: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await http.post<{ logo: string }>(`/workspaces/${slug}/branding/logo`, formData);
  return res.data;
}

export async function deleteLogo(slug: string): Promise<void> {
  await http.delete(`/workspaces/${slug}/branding/logo`);
}
