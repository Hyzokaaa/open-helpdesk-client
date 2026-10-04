import { http } from "@modules/app/modules/http/domain/http";
import { filenameFromDisposition, ImportPreview, ImportSetting, overwriteParam } from "../domain/workspace-import";

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
  icon: string | null;
}

export interface DomainVerificationResult {
  verified: boolean;
  dnsValid: boolean;
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
  organizationId: string | null;
  avatarUrl: string | null;
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

export async function getWorkspace(slug: string, options?: { silent?: boolean }): Promise<WorkspaceDetail> {
  const res = await http.get<WorkspaceDetail>(
    `/workspaces/${slug}`,
    options?.silent ? { headers: { "X-Silent-Errors": "true" } } : undefined,
  );
  return res.data;
}

export async function checkSlug(name: string): Promise<{ slug: string; available: boolean; suggestions: string[] }> {
  const res = await http.get<{ slug: string; available: boolean; suggestions: string[] }>(`/workspaces/check-slug?name=${encodeURIComponent(name)}`);
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

export async function updateMemberOrganization(
  slug: string,
  userId: string,
  organizationId: string | null,
): Promise<void> {
  await http.patch(`/workspaces/${slug}/members/${userId}/organization`, { organizationId });
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

/** Bytes moved so far, and the total when the other side announced it. */
export type TransferProgress = (loaded: number, total: number | undefined) => void;

/**
 * The workspace as a file encrypted with `password`, and the name the server gave it. Large
 * workspaces carry their files too, so this may take minutes; `onProgress` follows the download.
 */
export async function exportWorkspace(
  slug: string,
  password: string,
  onProgress?: TransferProgress,
): Promise<{ blob: Blob; filename: string }> {
  const res = await http.post<Blob>(`/workspaces/${slug}/export`, { password }, {
    responseType: "blob",
    onDownloadProgress: onProgress ? (e) => onProgress(e.loaded, e.total) : undefined,
  });
  const disposition = res.headers["content-disposition"] as string | undefined;
  return { blob: res.data, filename: filenameFromDisposition(disposition, `${slug}.ohd`) };
}

/** An export is read from an uploaded file or fetched by the server from an export link. */
export type ImportSource = { kind: "file"; file: File } | { kind: "url"; url: string };

function importForm(source: ImportSource, password: string): FormData {
  const form = new FormData();
  if (source.kind === "file") form.append("file", source.file, source.file.name);
  else form.append("url", source.url);
  if (password) form.append("password", password);
  return form;
}

/**
 * What an export brings, read by the server without importing anything. The file is uploaded
 * here and again by importWorkspace; `onProgress` follows each upload.
 */
export async function previewWorkspaceImport(
  slug: string,
  source: ImportSource,
  password: string,
  onProgress?: TransferProgress,
): Promise<ImportPreview> {
  // No Content-Type: the browser sets multipart/form-data with its boundary
  const res = await http.post<ImportPreview>(`/workspaces/${slug}/import/preview`, importForm(source, password), {
    onUploadProgress: onProgress ? (e) => onProgress(e.loaded, e.total) : undefined,
  });
  return res.data;
}

export interface ImportResult {
  usersCreated: number;
  membersAdded: number;
  tagsImported: number;
  categoriesImported: number;
  organizationsImported: number;
  departmentsImported: number;
  projectsImported: number;
  ticketsImported: number;
  /** Tickets left as they were because the workspace already had them; reported as a notice */
  ticketsAlreadyPresent?: number;
  commentsImported: number;
  /** Comments the import could not place; reported as a warning */
  commentsSkipped: number;
  descriptionEditsImported: number;
  commentEditsImported: number;
  attachmentsImported: number;
  /** Attachments whose file the export did not carry (older exports); reported as a warning */
  attachmentsSkipped: number;
  /** Attachments of tickets the workspace already had, so not imported again */
  attachmentsOfExistingTickets?: number;
  participantsImported: number;
  cannedResponsesImported: number;
  customFieldsImported: number;
  csatResponsesImported: number;
  kbCategoriesImported: number;
  kbArticlesImported: number;
  auditLogImported: number;
  /** Target settings the import overwrote, among those asked for */
  settingsApplied: ImportSetting[];
}

/** Without `overwrite` the import changes none of the target's settings. */
export async function importWorkspace(
  slug: string,
  source: ImportSource,
  password: string,
  overwrite: ImportSetting[] = [],
  onProgress?: TransferProgress,
): Promise<ImportResult> {
  const res = await http.post<ImportResult>(`/workspaces/${slug}/import`, importForm(source, password), {
    params: { overwrite: overwriteParam(overwrite) },
    onUploadProgress: onProgress ? (e) => onProgress(e.loaded, e.total) : undefined,
  });
  return res.data;
}

/** A single-use link to an export encrypted with `password`; the importer needs both. */
export async function createExportToken(slug: string, password: string): Promise<{ url: string; expiresAt: string }> {
  const res = await http.post<{ url: string; expiresAt: string }>(`/workspaces/${slug}/export/token`, { password });
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

export async function uploadIcon(slug: string, file: File): Promise<{ icon: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await http.post<{ icon: string }>(`/workspaces/${slug}/branding/icon`, formData);
  return res.data;
}

export async function deleteIcon(slug: string): Promise<void> {
  await http.delete(`/workspaces/${slug}/branding/icon`);
}
