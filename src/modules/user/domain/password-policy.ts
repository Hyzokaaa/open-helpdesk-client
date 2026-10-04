// Mirrors the backend rule (src/user/domain/password-policy.ts) for every NEW password.
// Existing passwords are never re-checked, so sign-in keeps accepting older, shorter ones.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export function isPasswordAcceptable(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    password.trim().length > 0
  );
}
