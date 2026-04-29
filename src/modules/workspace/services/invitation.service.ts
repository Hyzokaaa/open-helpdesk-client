import { http } from "@modules/app/modules/http/domain/http";

export interface InvitationItem {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface InvitationDetail {
  id: string;
  workspaceName: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  accountExists: boolean;
}

export async function createInvitation(
  slug: string,
  data: { email: string; role: string },
): Promise<InvitationItem> {
  const res = await http.post<InvitationItem>(
    `/workspaces/${slug}/invitations`,
    data,
  );
  return res.data;
}

export async function listInvitations(slug: string): Promise<InvitationItem[]> {
  const res = await http.get<InvitationItem[]>(
    `/workspaces/${slug}/invitations`,
  );
  return res.data;
}

export async function cancelInvitation(
  slug: string,
  id: string,
): Promise<void> {
  await http.delete(`/workspaces/${slug}/invitations/${id}`);
}

export async function getInvitationByToken(
  token: string,
): Promise<InvitationDetail | null> {
  const res = await http.get<InvitationDetail>(
    `/invitations/by-token/${token}`,
  );
  return res.data;
}

export async function acceptInvitation(token: string): Promise<{ workspaceId: string; role: string }> {
  const res = await http.post<{ workspaceId: string; role: string }>(
    `/invitations/accept`,
    { token },
  );
  return res.data;
}

export async function rejectInvitation(token: string): Promise<void> {
  await http.post(`/invitations/reject`, { token });
}
