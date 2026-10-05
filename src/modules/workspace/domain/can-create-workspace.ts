import type { AuthUser } from "@modules/user/domain/auth-user";

/**
 * Whether to offer creating a workspace. The backend decides who may (system admins, or anyone
 * when the installation allows self-service) and sends it with the profile; the only rule kept
 * here is a UI one: a custom domain shows a single workspace, so it never offers a new one.
 */
export function canCreateWorkspace(user: Pick<AuthUser, "capabilities"> | null | undefined, isCustomDomain: boolean): boolean {
  if (isCustomDomain) return false;
  return user?.capabilities?.createWorkspace ?? false;
}
