import { http } from "@modules/app/modules/http/domain/http";

export interface WorkspaceCreationSettings {
  /** Whether any signed-in user may create a workspace; system admins always may. */
  selfService: boolean;
  /** Fixed by the server environment (WORKSPACE_SELF_SERVICE); the panel cannot change it. */
  lockedByEnvironment: boolean;
}

export async function getWorkspaceCreationSettings(): Promise<WorkspaceCreationSettings> {
  const res = await http.get<WorkspaceCreationSettings>("/admin/workspace-settings");
  return res.data;
}

export async function updateWorkspaceCreationSettings(selfService: boolean): Promise<WorkspaceCreationSettings> {
  const res = await http.put<WorkspaceCreationSettings>("/admin/workspace-settings", { selfService });
  return res.data;
}
