export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isSystemAdmin: boolean;
  isEmailVerified: boolean;
  language: string;
  theme: string;
  dateFormat: string;
  timezone: string;
  avatarUrl: string | null;
  /** What this user may do across the installation, as decided by the backend. */
  capabilities: {
    createWorkspace: boolean;
  };
}
